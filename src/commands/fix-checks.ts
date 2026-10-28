import { DEFAULT_CHECK_TIMEOUT_MS } from "../config/schema.js";
import type { RailStep } from "../ui/rail.js";
import { runSubprocess } from "../utils/subprocess.js";
import { diffFixChanges, restoreFixChanges, type WorktreeSnapshot } from "./fix-rollback.js";

// Returned text is capped per stream. The tail is kept because compilers
// print the failing diagnostic last.
const MAX_CHECK_OUTPUT_BYTES = 8_000;

interface ResolvedProjectChecks {
	commands: string[];
	timeoutMs: number;
}

export type ProjectCheckConfig = ResolvedProjectChecks | { error: string };

export interface ProjectCheckFailure {
	command: string;
	exitCode: number;
	timedOut: boolean;
}

interface CheckConfigInput {
	fix?: { checks?: readonly string[]; checkTimeoutMs?: number };
}

interface CheckOptionInput {
	checks?: readonly string[];
	checkTimeoutMs?: number;
}

interface CheckRail {
	start(label: string): void;
	complete(step: Pick<RailStep, "status" | "label" | "notes">): void;
	finish?(opts: { footer: string }): void;
}

export const isProjectCheckError = (resolved: ProjectCheckConfig): resolved is { error: string } =>
	"error" in resolved;

// Repeatable commander option. Each flag is one command; commas stay intact
// because a shell command may contain them.
export const collectCheckOption = (value: string, previous: string[] = []): string[] => [
	...previous,
	value,
];

const normalizeCommands = (commands: readonly string[]): string[] => {
	const normalized: string[] = [];
	for (const command of commands) {
		if (typeof command !== "string") continue;
		const trimmed = command.trim();
		if (trimmed.length > 0) normalized.push(trimmed);
	}
	return normalized;
};

// Opt-in only. Order is every `fix.checks` entry, then each `--check` flag.
// Package scripts are never read or executed here.
export const resolveProjectChecks = (
	config: CheckConfigInput,
	options: CheckOptionInput = {},
): ProjectCheckConfig => {
	const commands = normalizeCommands([...(config.fix?.checks ?? []), ...(options.checks ?? [])]);
	const configuredTimeout = config.fix?.checkTimeoutMs ?? DEFAULT_CHECK_TIMEOUT_MS;
	const timeoutMs = options.checkTimeoutMs ?? configuredTimeout;
	if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
		return { error: "Project check timeout must be a positive number of milliseconds." };
	}
	return { commands, timeoutMs };
};

const shellCommand = (command: string): { bin: string; args: string[] } => {
	if (process.platform === "win32") {
		return { bin: process.env.ComSpec ?? "cmd.exe", args: ["/d", "/c", command] };
	}
	return { bin: "sh", args: ["-c", command] };
};

const isTimeoutError = (error: unknown): boolean =>
	error instanceof Error && error.message.includes("timed out");

const combineOutput = (stdout: string, stderr: string): string =>
	[stdout, stderr].filter((part) => part.length > 0).join("\n");

export const boundCommandOutput = (text: string, truncated: boolean, maxChars: number): string => {
	const trimmed = text.trim();
	const overCap = trimmed.length > maxChars;
	const body = overCap ? trimmed.slice(trimmed.length - maxChars) : trimmed;
	if (!truncated && !overCap) return body;
	if (body.startsWith("[output truncated]")) return body;
	return body.length > 0 ? `[output truncated]\n${body}` : "[output truncated]";
};

const outputNotes = (output: string): string[] | undefined => {
	if (output.length === 0) return undefined;
	const lines = output.split(/\r?\n/).filter((line) => line.length > 0);
	const maxLines = 40;
	if (lines.length <= maxLines) return lines;
	return ["[earlier lines omitted]", ...lines.slice(lines.length - maxLines)];
};

interface OneCheck {
	ok: boolean;
	exitCode: number;
	timedOut: boolean;
	output: string;
}

const runOneCheck = async (cwd: string, command: string, timeoutMs: number): Promise<OneCheck> => {
	const shell = shellCommand(command);
	try {
		const result = await runSubprocess(shell.bin, shell.args, {
			cwd,
			timeout: timeoutMs,
			maxOutputBytes: MAX_CHECK_OUTPUT_BYTES,
		});
		const truncated = Boolean(result.stdoutTruncated || result.stderrTruncated);
		const output = boundCommandOutput(
			combineOutput(result.stdout, result.stderr),
			truncated,
			MAX_CHECK_OUTPUT_BYTES,
		);
		if (result.exitCode === 0) return { ok: true, exitCode: 0, timedOut: false, output };
		const exitCode = result.exitCode === null ? 1 : result.exitCode;
		return { ok: false, exitCode, timedOut: false, output };
	} catch (error) {
		if (isTimeoutError(error)) return { ok: false, exitCode: 1, timedOut: true, output: "" };
		const message = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			exitCode: 1,
			timedOut: false,
			output: boundCommandOutput(message, false, MAX_CHECK_OUTPUT_BYTES),
		};
	}
};

const failureLabel = (command: string, check: OneCheck): string =>
	check.timedOut
		? `Check timed out: ${command}`
		: `Check failed: ${command} (exit ${check.exitCode})`;

export const runProjectChecks = async (
	cwd: string,
	commands: readonly string[],
	timeoutMs: number,
	rail: CheckRail,
): Promise<ProjectCheckFailure | null> => {
	for (const command of commands) {
		rail.start(`Check: ${command}`);
		const check = await runOneCheck(cwd, command, timeoutMs);
		if (check.ok) {
			rail.complete({ status: "done", label: `Check passed: ${command}` });
			continue;
		}
		rail.complete({
			status: "failed",
			label: failureLabel(command, check),
			notes: outputNotes(check.output),
		});
		return { command, exitCode: check.exitCode, timedOut: check.timedOut };
	}
	return null;
};

const runOptInProjectChecks = async (input: {
	root: string;
	commands: readonly string[];
	timeoutMs: number;
	snapshot: WorktreeSnapshot;
	rail: CheckRail;
}): Promise<ProjectCheckFailure | null> => {
	const changes = diffFixChanges(input.root, input.snapshot);
	const failure = await runProjectChecks(input.root, input.commands, input.timeoutMs, input.rail);
	if (!failure) return null;
	restoreFixChanges(input.root, input.snapshot, changes);
	input.rail.complete({
		status: "warn",
		label: "Rolled back files changed by this fix",
	});
	return failure;
};

export const enforceProjectChecks = async (input: {
	root: string;
	commands: readonly string[];
	timeoutMs: number;
	snapshot: WorktreeSnapshot;
	rail: CheckRail;
	fixSteps: number;
	fixResolved: number;
}): Promise<{
	exitCode: number;
	errorKind?: "timeout";
	fixSteps: number;
	fixResolved: number;
} | null> => {
	const failure = await runOptInProjectChecks(input);
	if (!failure) return null;
	input.rail.finish?.({
		footer: failure.timedOut ? "Timed out · rolled back" : "Check failed · rolled back",
	});
	return {
		exitCode: failure.exitCode === 0 ? 1 : failure.exitCode,
		...(failure.timedOut ? { errorKind: "timeout" as const } : {}),
		fixSteps: input.fixSteps,
		fixResolved: input.fixResolved,
	};
};
