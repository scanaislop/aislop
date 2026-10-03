import os from "node:os";
import type { AislopConfig } from "../config/index.js";
import { recordFullScanActivity } from "../engagement/full-scan-activity.js";
import type { EngineResult } from "../engines/types.js";
import { detectAislopHooks } from "../hooks/install/registry.js";
import { renderDiagnostics } from "../output/terminal.js";
import type { ScoreResult } from "../scoring/index.js";
import { isCiEnv } from "../telemetry/env.js";
import { detectInvocation } from "../ui/invocation.js";
import { renderMissingTools } from "../ui/summary.js";
import type { Coverage } from "../utils/discover.js";
import { renderBaselineSummary, type ScanBaselineSummary } from "./scan-baseline.js";
import { renderCoverageNotice } from "./scan-coverage.js";
import { buildHookNudge } from "./scan-hook-nudge.js";
import { isFullProjectScan, isHistoryComparableScan, type ScanOptions } from "./scan-options.js";
import type { PreparedScan } from "./scan-pipeline.js";
import { buildScanRender } from "./scan-render.js";

export interface ScanOutputInput {
	prepared: PreparedScan;
	config: AislopConfig;
	options: ScanOptions;
	results: EngineResult[];
	scoreResult: ScoreResult;
	scanCoverage: Coverage;
	elapsedMs: number;
	missingTools: string[];
	baselineSummary?: ScanBaselineSummary;
	includeHeader: boolean;
	counts: { errorCount: number; warningCount: number };
}

const writeHookNudge = (resolvedDir: string): void => {
	const nudge = buildHookNudge({
		installedAgentCount: detectAislopHooks({ home: os.homedir(), cwd: resolvedDir }).length,
		isTty: Boolean(process.stdout.isTTY),
		isCi: isCiEnv(),
		invocation: detectInvocation(),
	});
	if (nudge) process.stdout.write(nudge);
};

export const writeMachineOutput = async (input: ScanOutputInput): Promise<boolean> => {
	if (input.options.sarif) {
		const { buildSarifLog } = await import("../output/sarif.js");
		console.log(JSON.stringify(buildSarifLog(input.results), null, 2));
		return true;
	}
	if (!input.options.json) return false;
	const { buildJsonOutput } = await import("../output/json.js");
	const jsonOut = buildJsonOutput(
		input.results,
		input.scoreResult,
		input.prepared.scanScope.scoreFileCount,
		input.elapsedMs,
		input.scanCoverage,
		input.baselineSummary,
	);
	console.log(JSON.stringify(jsonOut, null, 2));
	return true;
};

const writeUnscoreableOutput = (input: ScanOutputInput): void => {
	const { projectInfo, scanScope } = input.prepared;
	const reportProjectInfo = {
		...projectInfo,
		coverage: input.scanCoverage,
		sourceFileCount: scanScope.scoreFileCount,
	};
	const diagnostics = input.results.flatMap((r) => r.diagnostics);
	process.stdout.write(renderCoverageNotice(reportProjectInfo, input.includeHeader));
	// Score is withheld, but findings still ran on the supported files; show them so a CI failure on an error diagnostic is explained.
	if (diagnostics.length > 0) {
		process.stdout.write(renderDiagnostics(diagnostics, input.options.verbose ?? false));
	}
	process.stdout.write(
		renderMissingTools({ tools: input.missingTools, invocation: detectInvocation() }),
	);
	if (input.baselineSummary) {
		process.stdout.write(renderBaselineSummary(input.baselineSummary, detectInvocation()));
	}
};

export const writeHumanOutput = (input: ScanOutputInput): void => {
	if (!input.scanCoverage.scoreable) {
		writeUnscoreableOutput(input);
		return;
	}
	const { options, config, scoreResult } = input;
	const { resolvedDir, projectInfo, scanScope } = input.prepared;
	const showPilotInvitation =
		isHistoryComparableScan(options) && !isCiEnv()
			? recordFullScanActivity(
					{
						directory: resolvedDir,
						score: scoreResult.score,
						errors: input.counts.errorCount,
						warnings: input.counts.warningCount,
						files: scanScope.scoreFileCount,
					},
					isFullProjectScan(options) && options.printBrand !== false,
					config.telemetry,
				)
			: false;

	process.stdout.write(
		buildScanRender({
			projectName: projectInfo.projectName ?? "project",
			language: projectInfo.languages[0] ?? "unknown",
			fileCount: scanScope.scoreFileCount,
			results: input.results,
			diagnostics: input.results.flatMap((r) => r.diagnostics),
			score: scoreResult,
			elapsedMs: input.elapsedMs,
			thresholds: config.scoring.thresholds,
			verbose: options.verbose,
			includeHeader: input.includeHeader,
			printBrand: options.printBrand,
			showPilotInvitation,
			baseline: input.baselineSummary,
		}),
	);

	if (options.command !== "ci" && options.printBrand !== false) writeHookNudge(resolvedDir);
};
