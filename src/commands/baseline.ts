import path from "node:path";
import {
	isHookBaselinePath,
	readBaseline,
	resolveBaselinePath,
	writeBaseline,
} from "../baseline/baseline-file.js";
import { buildBaseline, matchBaseline, pruneBaseline } from "../baseline/match.js";
import type { AislopConfig } from "../config/index.js";
import type { Diagnostic, EngineResult } from "../engines/types.js";
import { detectInvocation } from "../ui/invocation.js";
import { log } from "../ui/logger.js";
import { relativePosix } from "../utils/paths.js";
import { fullyRanEngines } from "./scan-baseline.js";
import { prepareScan, runScanEngines } from "./scan-pipeline.js";
import { scanTargetError } from "./scan-validation.js";

const FULL_SCAN = { kind: "full" } as const;

const incompleteEngines = (results: EngineResult[]): string[] =>
	results.flatMap((result) => {
		if (result.failed) return [`${result.engine} (failed)`];
		if (result.missingTools?.length) {
			return [`${result.engine} (missing ${result.missingTools.join(", ")})`];
		}
		return [];
	});

const scanForBaseline = async (
	resolvedDir: string,
	config: AislopConfig,
): Promise<{
	diagnostics: Diagnostic[];
	staleEngines: ReturnType<typeof fullyRanEngines>;
	incomplete: string[];
}> => {
	const prepared = await prepareScan(resolvedDir, config, FULL_SCAN);
	const { results } = await runScanEngines(prepared, config, true);
	return {
		diagnostics: results.flatMap((result) => result.diagnostics),
		staleEngines: fullyRanEngines(results),
		incomplete: incompleteEngines(results),
	};
};

const resolveBaselineFile = (resolvedDir: string, config: AislopConfig): string | null => {
	const filePath = resolveBaselinePath(resolvedDir, config.ci.baseline);
	if (!isHookBaselinePath(resolvedDir, filePath)) return filePath;
	log.error(
		`${relativePosix(resolvedDir, filePath)} holds the hook score baseline. Point ci.baseline at a separate file such as .aislop/ci-baseline.json.`,
	);
	return null;
};

const resolveTarget = (directory: string): string | null => {
	const resolvedDir = path.resolve(directory);
	const error = scanTargetError(resolvedDir, {
		changes: false,
		staged: false,
		verbose: false,
		json: false,
	});
	if (error) {
		log.error(error);
		return null;
	}
	return resolvedDir;
};

export const baselineWriteCommand = async (
	directory: string,
	config: AislopConfig,
): Promise<{ exitCode: number }> => {
	const resolvedDir = resolveTarget(directory);
	if (!resolvedDir) return { exitCode: 1 };
	const filePath = resolveBaselineFile(resolvedDir, config);
	if (!filePath) return { exitCode: 1 };
	const { diagnostics, incomplete } = await scanForBaseline(resolvedDir, config);
	if (incomplete.length > 0) {
		log.error(
			`Not writing a baseline from an incomplete scan: ${incomplete.join("; ")}. Install the missing tools or fix the failing engines, then run it again.`,
		);
		return { exitCode: 1 };
	}
	const baseline = buildBaseline(diagnostics, resolvedDir);
	writeBaseline(filePath, baseline);
	const relative = relativePosix(resolvedDir, filePath);
	log.success(
		`Recorded ${diagnostics.length} finding(s) in ${baseline.entries.length} baseline entr${baseline.entries.length === 1 ? "y" : "ies"} at ${relative}`,
	);
	if (!config.ci.baseline) {
		log.info(`Set ci.baseline: ${relative} in .aislop/config.yml so scan and ci use it.`);
	}
	return { exitCode: 0 };
};

export const baselinePruneCommand = async (
	directory: string,
	config: AislopConfig,
): Promise<{ exitCode: number }> => {
	const resolvedDir = resolveTarget(directory);
	if (!resolvedDir) return { exitCode: 1 };
	const filePath = resolveBaselineFile(resolvedDir, config);
	if (!filePath) return { exitCode: 1 };
	const relative = relativePosix(resolvedDir, filePath);
	const loaded = readBaseline(filePath);
	if (loaded.kind !== "ok") {
		log.error(
			loaded.kind === "missing"
				? `No baseline at ${relative}. Run ${detectInvocation()} baseline write first.`
				: `Baseline ${relative} is invalid (${loaded.reason}).`,
		);
		return { exitCode: 1 };
	}
	const { diagnostics, staleEngines } = await scanForBaseline(resolvedDir, config);
	const matched = matchBaseline({
		baseline: loaded.baseline,
		diagnostics,
		rootDirectory: resolvedDir,
		scopeFiles: null,
		staleEngines,
	});
	if (matched.staleCount === 0) {
		log.success(`No stale entries in ${relative}`);
		return { exitCode: 0 };
	}
	writeBaseline(filePath, pruneBaseline(loaded.baseline, matched));
	log.success(`Removed ${matched.staleCount} fixed finding(s) from ${relative}`);
	return { exitCode: 0 };
};
