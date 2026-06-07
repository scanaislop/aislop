import { type AgentUsage, createSessionState, type SessionStore } from "../agents/session-state.js";
import type { TuiHandle } from "./agent-tui/mount.js";

interface AgentTuiContext {
	provider: string;
	source: string;
	directory: string;
	mode: string;
	targetScore: number;
}

export interface AgentTuiOptions extends AgentTuiContext {
	write?: (s: string) => void;
	tty?: boolean;
}

interface CompleteStep {
	status: "done" | "warn" | "failed" | "skipped";
	label: string;
}

export interface AgentTuiFile {
	filePath: string;
	updatedAt: string;
	source?: string;
	additions?: number | null;
	deletions?: number | null;
	binary?: boolean;
}

const parseScore = (value: string): number | null => {
	const n = Number.parseInt(value.trim(), 10);
	return Number.isNaN(n) ? null : n;
};

const classify = (
	line: string,
): { kind: "assistant" | "tool" | "exec" | "event"; text: string } => {
	for (const kind of ["assistant", "tool", "exec"] as const) {
		if (line.startsWith(`${kind}: `)) return { kind, text: line.slice(kind.length + 2) };
	}
	return { kind: "event", text: line };
};

// Backs the agent run loop's reporter API with the session-state store. In a TTY
// it renders the Ink TUI; otherwise it streams plain lines (CI-safe).
export class AgentTui {
	private readonly store: SessionStore;
	private readonly write: (s: string) => void;
	private readonly tty: boolean;
	private handle: Promise<TuiHandle> | null = null;
	private resolvedHandle: TuiHandle | null = null;
	private paused = false;

	constructor(options: AgentTuiOptions) {
		this.write = options.write ?? ((s) => process.stdout.write(s));
		this.tty = options.tty ?? Boolean(process.stdout.isTTY);
		this.store = createSessionState({
			provider: options.provider,
			providerSource: options.source,
			targetRepo: options.directory,
			targetScore: options.targetScore,
		});
	}

	private ensureMounted(): void {
		if (!this.tty || this.handle || this.paused) return;
		this.handle = import("./agent-tui/mount.js")
			.then((m) => m.mountAgentTui(this.store))
			.then((handle) => {
				this.resolvedHandle = handle;
				return handle;
			});
	}

	pause(): void {
		if (!this.tty) return;
		this.paused = true;
		this.resolvedHandle?.unmount();
		this.resolvedHandle = null;
		this.handle = null;
	}

	resume(): void {
		if (!this.tty || !this.paused) return;
		this.paused = false;
		this.ensureMounted();
	}

	setActions(actions: string[]): void {
		this.store.update({ actions: actions.filter((action) => action.trim().length > 0) });
	}

	start(label: string): void {
		this.store.addStep(label);
		this.ensureMounted();
	}

	complete(step: CompleteStep): void {
		this.store.completeStep(step.status, step.label);
		if (!this.tty) this.write(` ${step.label}\n`);
	}

	setActiveLabel(label: string): void {
		this.store.setActiveStepLabel(label);
	}

	setMetric(label: string, value: string | number | null | undefined): void {
		const text = value == null ? "" : String(value);
		if (label === "Score") {
			const [start, end] = text.split("->").map((part) => part.trim());
			this.store.update({ scoreStart: parseScore(start ?? ""), score: parseScore(end ?? "") });
		} else if (label === "Remaining") {
			this.store.update({ findingsRemaining: parseScore(text) });
		} else if (label === "Pass") {
			this.store.update({ passes: parseScore(text) ?? 0 });
		} else if (label === "Worktree") {
			this.store.update({ worktree: text || null });
		}
	}

	setUsage(usage: AgentUsage): void {
		this.store.setUsage(usage);
	}

	appendLog(source: string, line: string): void {
		const entry = classify(line);
		// Drop low-signal lifecycle events (thread/turn/item.*) — the Steps panel
		// and sidebar already carry session state; only show what the agent did.
		if (entry.kind === "event") return;
		const last = this.store.getState().activity.at(-1);
		if (last && last.kind === entry.kind && last.text === entry.text) return;
		this.store.pushActivity({ ...entry, at: Date.now() });
		if (!this.tty) this.write(`   ${source.padEnd(8)} ${line}\n`);
	}

	setFiles(files: AgentTuiFile[]): void {
		this.store.setFiles(
			files.map((file) => ({
				filePath: file.filePath,
				additions: file.additions,
				deletions: file.deletions,
				binary: file.binary,
			})),
		);
	}

	async askDecision(
		question: string,
		options: { value: string; label: string; hint?: string }[],
	): Promise<string> {
		return this.store.askDecision(question, options);
	}

	finish(opts: { footer: string }): void {
		this.store.finish({
			scoreStart: this.store.getState().scoreStart,
			score: this.store.getState().score,
			passes: this.store.getState().passes,
			findingsRemaining: this.store.getState().findingsRemaining,
			changedFiles: [...this.store.getState().filesChanged],
			worktree: this.store.getState().worktree,
			sessionId: null,
		});
		this.teardown();
		if (!this.tty) this.write(` ${opts.footer}\n`);
	}

	abort(): void {
		this.store.update({ phase: "error" });
		this.teardown();
	}

	// Exit the alt-screen synchronously so any summary printed by the caller
	// lands on the restored shell instead of being wiped by an async unmount.
	private teardown(): void {
		if (this.resolvedHandle) {
			this.resolvedHandle.unmount();
			this.resolvedHandle = null;
			this.handle = null;
		} else {
			void this.handle?.then((handle) => handle.unmount());
			this.handle = null;
		}
	}
}
