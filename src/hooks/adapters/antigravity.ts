import path from "node:path";
import { buildHookScanCompletedProps, track } from "../../telemetry/index.js";
import { type AislopFeedback, buildFeedback } from "../feedback.js";
import { resolveAgentPaths, resolveHookRoot } from "../io/project-root.js";
import { acquireHookLock } from "../io/scan-lock.js";
import { resolveHookFiles, runScopedScan } from "../io/scoped-scan.js";
import { appendSessionFiles, readBaseline } from "../quality-gate/baseline.js";

export interface AntigravityHookStdin {
	conversationId?: string;
	workspacePaths?: string[];
	transcriptPath?: string;
	artifactDirectoryPath?: string;
	modelName?: string;
	lastUserInput?: string;
	hookEventName?: string;
	cwd?: string;
	stepIdx?: number;
	toolCall?: {
		id?: string;
		name?: string;
		args?: {
			Path?: string;
			path?: string;
			file_path?: string;
			filePath?: string;
			Content?: string;
			Target?: string;
			Replacement?: string;
			[key: string]: unknown;
		};
	};
	result?: string;
	error?: string;
}

export interface AntigravityHookOutput {
	overwriteResult?: string;
}

export const extractAntigravityFiles = (stdin: AntigravityHookStdin): string[] => {
	const files = new Set<string>();
	const args = stdin.toolCall?.args;
	if (args) {
		const candidate = args.Path ?? args.path ?? args.file_path ?? args.filePath;
		if (typeof candidate === "string" && candidate.length > 0) {
			files.add(candidate);
		}
	}
	return Array.from(files);
};

export const resolveAntigravityCwd = (stdin: AntigravityHookStdin): string => {
	if (stdin.cwd && path.isAbsolute(stdin.cwd)) return stdin.cwd;
	if (Array.isArray(stdin.workspacePaths) && stdin.workspacePaths.length > 0) {
		const first = stdin.workspacePaths[0];
		if (typeof first === "string" && path.isAbsolute(first)) return first;
	}
	if (stdin.cwd && typeof stdin.cwd === "string" && stdin.cwd.trim().length > 0) {
		return path.resolve(stdin.cwd);
	}
	return process.cwd();
};

export const parseAntigravityStdin = (raw: string): AntigravityHookStdin => {
	if (!raw.trim()) return {};
	try {
		return JSON.parse(raw) as AntigravityHookStdin;
	} catch {
		return {};
	}
};

export const formatAntigravityMessage = (
	feedback: AislopFeedback,
	originalResult?: string,
): string => {
	const { error, warning } = feedback.counts;
	const parts: string[] = [];

	if (originalResult && typeof originalResult === "string" && originalResult.trim().length > 0) {
		parts.push(originalResult.trim());
	}

	const deltaText =
		typeof feedback.delta === "number"
			? ` (${feedback.delta >= 0 ? `+${feedback.delta}` : feedback.delta})`
			: "";
	const header =
		`[aislop] Score: ${feedback.score}/100${deltaText}` +
		`${feedback.baseline != null ? ` (baseline: ${feedback.baseline})` : ""}. ` +
		`${error} error${error === 1 ? "" : "s"}, ${warning} warning${warning === 1 ? "" : "s"}.`;

	const findingLines = feedback.findings.map(
		(f) => `  - ${f.file}:${f.line} [${f.severity}] ${f.ruleId}: ${f.message}`,
	);
	if (feedback.elided && feedback.elided > 0) {
		findingLines.push(`  ...and ${feedback.elided} more.`);
	}

	const sections = [header, ...findingLines];
	if (feedback.nextSteps.length > 0) {
		sections.push(`Next steps:\n${feedback.nextSteps.map((s) => `  • ${s}`).join("\n")}`);
	}

	parts.push(sections.join("\n"));
	return parts.join("\n\n");
};

export const renderAntigravityOutput = (message?: string): AntigravityHookOutput => {
	if (!message) return {};
	return { overwriteResult: message };
};

const readStdin = async (): Promise<string> => {
	if (process.stdin.isTTY) return "";
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
	return Buffer.concat(chunks).toString("utf-8");
};

export const runAntigravityHook = async (
	deps: { stdin?: () => Promise<string>; write?: (s: string) => void } = {},
): Promise<number> => {
	const getStdin = deps.stdin ?? readStdin;
	const write = deps.write ?? ((s: string) => process.stdout.write(s));

	let raw = "";
	try {
		raw = await getStdin();
	} catch {
		return 0;
	}

	const input = parseAntigravityStdin(raw);
	if (input.error) return 0;

	const agentCwd = resolveAntigravityCwd(input);
	const cwd = resolveHookRoot(agentCwd);
	const files = resolveHookFiles(cwd, resolveAgentPaths(agentCwd, extractAntigravityFiles(input)));

	if (files.length === 0) return 0;
	const release = acquireHookLock(cwd);
	if (!release) return 0;

	try {
		const { diagnostics, score, rootDirectory } = await runScopedScan(cwd, files);
		const baseline = readBaseline(cwd);
		appendSessionFiles(cwd, files);
		const feedback = buildFeedback(
			diagnostics,
			score,
			rootDirectory,
			baseline
				? { score: baseline.score, findingFingerprints: baseline.findingFingerprints }
				: undefined,
			{ agent: "antigravity", touchedFiles: files },
		);
		track({
			event: "hook_scan_completed",
			properties: buildHookScanCompletedProps({
				agent: "antigravity",
				score,
				scoreDelta: baseline ? score - baseline.score : null,
				findingCount: diagnostics.length,
				fileCount: files.length,
			}),
		});

		if (diagnostics.length === 0 && !feedback.regressed) {
			write(JSON.stringify(renderAntigravityOutput()));
		} else {
			const formatted = formatAntigravityMessage(feedback, input.result);
			write(JSON.stringify(renderAntigravityOutput(formatted)));
		}
		return 0;
	} catch {
		// A hook crash must never fail the user's tool call.
		return 0;
	} finally {
		release();
	}
};
