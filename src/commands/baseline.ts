import path from "node:path";
import { readBaseline, resolveBaselinePath, writeBaseline } from "../baseline/baseline-file.js";
import { buildBaseline, matchBaseline, pruneBaseline } from "../baseline/match.js";
import type { AislopConfig } from "../config/index.js";
import type { Diagnostic } from "../engines/types.js";
import { detectInvocation } from "../ui/invocation.js";
import { log } from "../ui/logger.js";
import { relativePosix } from "../utils/paths.js";
import { fullyRanEngines } from "./scan-baseline.js";
import { prepareScan, runScanEngines } from "./scan-pipeline.js";
import { scanTargetError } from "./scan-validation.js";

const FULL_SCAN = { kind: "full" } as const;

const scanForBaseline = async (
	resolvedDir: string,
	config: AislopConfig,
): Promise<{ diagnostics: Diagnostic[]; staleEngines: ReturnType<typeof fullyRanEngines> }> => {
	const prepared = await prepareScan(resolvedDir, config, FULL_SCAN);
	const { results } = await runScanEngines(prepared, config, true);
	return {
		diagnostics: results.flatMap((result) => result.diagnostics),
		staleEngines: fullyRanEngines(results),
	};
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
	const filePath = resolveBaselinePath(resolvedDir, config.ci.baseline);
	const { diagnostics } = await scanForBaseline(resolvedDir, config);
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
	const filePath = resolveBaselinePath(resolvedDir, config.ci.baseline);
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
