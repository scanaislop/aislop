import type { TokenUsage } from "./pricing.js";

export interface ActivityLine {
	kind: "assistant" | "tool" | "exec" | "event";
	text: string;
	at: number;
}

export interface EditEntry {
	file: string;
	at: number;
}

export interface PendingDecision {
	question: string;
	options: { value: string; label: string; hint?: string }[];
	resolve: (value: string) => void;
}

export interface SessionSummary {
	scoreStart: number | null;
	score: number | null;
	passes: number;
	findingsRemaining: number | null;
	changedFiles: string[];
	worktree: string | null;
	sessionId: string | null;
}

export type SessionPhase =
	| "starting"
	| "running"
	| "awaiting-decision"
	| "publishing"
	| "done"
	| "error";

export interface AgentSessionState {
	provider: string;
	model: string | null;
	providerSource: string;
	scoreStart: number | null;
	score: number | null;
	targetScore: number;
	findingsRemaining: number | null;
	filesChanged: Set<string>;
	filesEdited: Set<string>;
	passes: number;
	toolCalls: number;
	tokens: TokenUsage;
	startedAt: number;
	worktree: string | null;
	targetRepo: string;
	branch: string | null;
	activity: ActivityLine[];
	recentEdits: EditEntry[];
	phase: SessionPhase;
	pendingDecision: PendingDecision | null;
	summary: SessionSummary | null;
}

export interface SessionStore {
	getState(): AgentSessionState;
	subscribe(fn: () => void): () => void;
	update(
		patch: Partial<AgentSessionState> | ((s: AgentSessionState) => Partial<AgentSessionState>),
	): void;
	pushActivity(line: ActivityLine): void;
	recordEdit(file: string, at?: number): void;
	addTokens(delta: Partial<TokenUsage>): void;
	incPass(): void;
	askDecision(question: string, options: PendingDecision["options"]): Promise<string>;
	finish(summary: SessionSummary): void;
}

const ACTIVITY_CAP = 200;
const EDITS_CAP = 8;

type SessionInit = Pick<
	AgentSessionState,
	"provider" | "providerSource" | "targetScore" | "targetRepo"
> &
	Partial<AgentSessionState>;

const buildInitialState = (init: SessionInit): AgentSessionState => ({
	model: null,
	scoreStart: null,
	score: null,
	findingsRemaining: null,
	filesChanged: new Set(),
	filesEdited: new Set(),
	passes: 0,
	toolCalls: 0,
	tokens: { in: 0, out: 0, cached: 0, total: 0 },
	startedAt: Date.now(),
	worktree: null,
	branch: null,
	activity: [],
	recentEdits: [],
	phase: "starting",
	pendingDecision: null,
	summary: null,
	...init,
});

export const createSessionState = (init: SessionInit): SessionStore => {
	const state = buildInitialState(init);

	const subscribers = new Set<() => void>();
	const emit = (): void => {
		for (const fn of subscribers) fn();
	};

	return {
		getState: () => state,
		subscribe(fn) {
			subscribers.add(fn);
			return () => {
				subscribers.delete(fn);
			};
		},
		update(patch) {
			Object.assign(state, typeof patch === "function" ? patch(state) : patch);
			emit();
		},
		pushActivity(line) {
			state.activity.push(line);
			if (state.activity.length > ACTIVITY_CAP) {
				state.activity.splice(0, state.activity.length - ACTIVITY_CAP);
			}
			emit();
		},
		recordEdit(file, at = Date.now()) {
			state.filesChanged.add(file);
			state.filesEdited.add(file);
			state.recentEdits.push({ file, at });
			if (state.recentEdits.length > EDITS_CAP) {
				state.recentEdits.splice(0, state.recentEdits.length - EDITS_CAP);
			}
			emit();
		},
		addTokens(delta) {
			const t = state.tokens;
			state.tokens = {
				in: t.in + (delta.in ?? 0),
				out: t.out + (delta.out ?? 0),
				cached: t.cached + (delta.cached ?? 0),
				total: t.total + (delta.total ?? 0),
			};
			emit();
		},
		incPass() {
			state.passes += 1;
			emit();
		},
		askDecision(question, options) {
			return new Promise<string>((resolve) => {
				state.pendingDecision = {
					question,
					options,
					resolve: (value) => {
						state.pendingDecision = null;
						state.phase = "running";
						emit();
						resolve(value);
					},
				};
				state.phase = "awaiting-decision";
				emit();
			});
		},
		finish(summary) {
			state.summary = summary;
			state.phase = "done";
			emit();
		},
	};
};
