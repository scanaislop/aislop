import { readBaseline, resolveBaselinePath } from "../baseline/baseline-file.js";
import { matchBaseline } from "../baseline/match.js";
import type { EngineName, EngineResult } from "../engines/types.js";
import { symbols as defaultSymbols, type Symbols } from "../ui/symbols.js";
import { theme as defaultTheme, style, type Theme } from "../ui/theme.js";
import { relativePosix } from "../utils/paths.js";

export interface ScanBaselineSummary {
	path: string;
	status: "ok" | "missing" | "invalid";
	reason?: string;
	accepted: number;
	new: number;
	stale: number;
}

interface ApplyBaselineInput {
	baselinePath: string | undefined;
	rootDirectory: string;
	results: EngineResult[];
	scopeFiles: string[] | null;
}

export const fullyRanEngines = (results: EngineResult[]): Set<EngineName> =>
	new Set(
		results
			.filter((result) => !result.skipped && !result.failed && !result.missingTools?.length)
			.map((result) => result.engine),
	);

export const applyScanBaseline = (
	input: ApplyBaselineInput,
): { results: EngineResult[]; summary: ScanBaselineSummary } | null => {
	if (!input.baselinePath) return null;
	const filePath = resolveBaselinePath(input.rootDirectory, input.baselinePath);
	const loaded = readBaseline(filePath);
	const baseline = loaded.kind === "ok" ? loaded.baseline : { version: 1 as const, entries: [] };
	const scopeFiles = input.scopeFiles
		? new Set(input.scopeFiles.map((file) => relativePosix(input.rootDirectory, file)))
		: null;
	const staleEngines = fullyRanEngines(input.results);

	const matched = matchBaseline({
		baseline,
		diagnostics: input.results.flatMap((result) => result.diagnostics),
		rootDirectory: input.rootDirectory,
		scopeFiles,
		staleEngines,
	});
	let offset = 0;
	const results = input.results.map((result) => {
		const diagnostics = matched.diagnostics.slice(offset, offset + result.diagnostics.length);
		offset += result.diagnostics.length;
		return { ...result, diagnostics };
	});

	return {
		results,
		summary: {
			path: relativePosix(input.rootDirectory, filePath),
			status: loaded.kind,
			...(loaded.kind === "invalid" ? { reason: loaded.reason } : {}),
			accepted: matched.accepted,
			new: matched.newFindings,
			stale: matched.staleCount,
		},
	};
};

export const baselineWarning = (summary: ScanBaselineSummary): string | null => {
	if (summary.status === "missing") {
		return `Baseline ${summary.path} not found; every finding counts as new. Run aislop baseline write to create it.`;
	}
	if (summary.status === "invalid") {
		return `Baseline ${summary.path} is invalid (${summary.reason}); every finding counts as new.`;
	}
	return null;
};

export const renderBaselineSummary = (
	summary: ScanBaselineSummary,
	invocation: string,
	deps: { theme?: Theme; symbols?: Symbols } = {},
): string => {
	const t = deps.theme ?? defaultTheme;
	const s = deps.symbols ?? defaultSymbols;
	const warning = baselineWarning(summary);
	if (warning) return `\n ${style(t, "warn", `${s.warn} ${warning}`)}\n`;
	const sep = style(t, "accent", "·");
	const parts = [
		style(t, "muted", `${summary.accepted} accepted`),
		style(t, summary.new > 0 ? "danger" : "success", `${summary.new} new`),
		style(t, summary.stale > 0 ? "warn" : "muted", `${summary.stale} stale`),
	];
	const hint =
		summary.stale > 0
			? `  ${style(t, "muted", `run ${invocation} baseline prune to drop fixed entries`)}`
			: "";
	return `\n ${style(t, "dim", "Baseline")}  ${parts.join(`  ${sep}  `)}${hint}\n`;
};
