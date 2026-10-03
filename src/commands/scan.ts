import path from "node:path";
import { performance } from "node:perf_hooks";
import type { AislopConfig } from "../config/index.js";
import { collectMissingTools } from "../engines/missing-tools.js";
import type { EngineResult } from "../engines/types.js";
import { calculateScore } from "../scoring/index.js";
import { type EngineCounts, withCommandLifecycle } from "../telemetry/index.js";
import { renderDisplayRows } from "../ui/display.js";
import { renderHeader } from "../ui/header.js";
import { log } from "../ui/logger.js";
import { applyChangeContext } from "../utils/change-context.js";
import { getChangedLineMap } from "../utils/git.js";
import { APP_VERSION } from "../version.js";
import { computeScanExitCode } from "./scan-exit-code.js";
import { applyScanBaseline, baselineWarning, type ScanBaselineSummary } from "./scan-baseline.js";
import { deriveScanCoverage } from "./scan-file-scope.js";
import { isMachineOutput, resolveScanScopeMode, type ScanOptions } from "./scan-options.js";
import { type PreparedScan, prepareScan, runScanEngines } from "./scan-pipeline.js";
import { writeHumanOutput, writeMachineOutput } from "./scan-output.js";
import { scanTargetError } from "./scan-validation.js";

export { buildScanRender } from "./scan-render.js";

const renderScopeRow = (value: string): string =>
	`${renderDisplayRows([{ label: "Scope", value }], { indent: 1 }).join("\n")}\n`;

export const scanCommand = async (
	directory: string,
	config: AislopConfig,
	options: ScanOptions,
): Promise<{ exitCode: number }> => {
	const resolvedDir = path.resolve(directory);
	const targetError = scanTargetError(resolvedDir, options);
	if (targetError) {
		if (options.json) {
			console.log(JSON.stringify({ error: targetError }, null, 2));
		} else {
			log.error(targetError);
		}
		return { exitCode: 1 };
	}

	const prepared = await prepareScan(resolvedDir, config, resolveScanScopeMode(options));
	const { projectInfo, scanScope } = prepared;

	return withCommandLifecycle(
		{
			command: options.command ?? "scan",
			config: config.telemetry,
			languages: projectInfo.languages,
			fileCount: scanScope.scoreFileCount,
		},
		() => runScanBody(prepared, config, options),
	);
};

const buildCompletion = (results: EngineResult[], exitCode: number, score: number | null) => {
	const allDiagnostics = results.flatMap((r) => r.diagnostics);
	const engineIssues: EngineCounts = {};
	const engineTimings: EngineCounts = {};
	for (const r of results) {
		engineIssues[r.engine] = r.diagnostics.length;
		engineTimings[r.engine] = Math.round(r.elapsed);
	}
	const enginesFailed = results.filter((r) => r.failed).map((r) => r.engine);
	return {
		exitCode,
		score,
		scoreable: score !== null,
		findingCount: allDiagnostics.length,
		errorCount: allDiagnostics.filter((d) => d.severity === "error").length,
		warningCount: allDiagnostics.filter((d) => d.severity === "warning").length,
		fixableCount: allDiagnostics.filter((d) => d.fixable).length,
		engineIssues,
		engineTimings,
		...(enginesFailed.length > 0 ? { properties: { engines_failed: enginesFailed } } : {}),
	};
};

const annotateResults = (
	prepared: PreparedScan,
	config: AislopConfig,
	options: ScanOptions,
	unannotated: EngineResult[],
	machineOutput: boolean,
): { results: EngineResult[]; baselineSummary?: ScanBaselineSummary } => {
	const { resolvedDir, scanScope } = prepared;
	const classifyChanges = options.changes && !options.staged;
	const changeMap = classifyChanges ? getChangedLineMap(resolvedDir, options.base) : null;
	const contextResults = changeMap
		? unannotated.map((result) => ({
				...result,
				diagnostics: applyChangeContext(result.diagnostics, changeMap, resolvedDir),
			}))
		: unannotated;
	const baselined = applyScanBaseline({
		baselinePath: config.ci.baseline,
		rootDirectory: resolvedDir,
		results: contextResults,
		scopeFiles:
			options.changes || options.staged ? [...scanScope.files, ...scanScope.testFiles] : null,
	});
	if (baselined && machineOutput) {
		const warning = baselineWarning(baselined.summary);
		if (warning) process.stderr.write(`${warning}\n`);
	}
	return { results: baselined?.results ?? contextResults, baselineSummary: baselined?.summary };
};

const runScanBody = async (prepared: PreparedScan, config: AislopConfig, options: ScanOptions) => {
	const { resolvedDir: _resolvedDir, projectInfo, scanScope } = prepared;
	const startTime = performance.now();
	const showHeader = options.showHeader !== false;
	const machineOutput = isMachineOutput(options);
	const projectName = projectInfo.projectName ?? "project";
	const language = projectInfo.languages[0] ?? "unknown";
	const printedHumanHeader = !machineOutput && showHeader;
	const { files, scoreFileCount, scopeLabel, testFiles } = scanScope;
	const scanCoverage = deriveScanCoverage(projectInfo.coverage, scoreFileCount);

	if (printedHumanHeader) {
		process.stdout.write(
			renderHeader({
				version: APP_VERSION,
				command: "Scan result",
				context: [projectName, language, `${scoreFileCount} files`],
				brand: options.printBrand !== false,
			}),
		);
	}

	if (!machineOutput) {
		process.stdout.write(renderScopeRow(`${files.length + testFiles.length} ${scopeLabel}`));
	}

	const { results: unannotated, suppressedCount } = await runScanEngines(
		prepared,
		config,
		machineOutput,
	);
	if (suppressedCount > 0 && !machineOutput) {
		log.muted(`Suppressed ${suppressedCount} finding(s) via aislop-ignore directives`);
	}

	const { results, baselineSummary } = annotateResults(
		prepared,
		config,
		options,
		unannotated,
		machineOutput,
	);

	const allDiagnostics = results.flatMap((r) => r.diagnostics);
	const elapsedMs = performance.now() - startTime;

	const scoreResult = calculateScore(
		allDiagnostics,
		config.scoring.weights,
		config.scoring.thresholds,
		scoreFileCount,
		config.scoring.smoothing,
		config.scoring.maxPerRule,
	);
	const scoreable = scanCoverage.scoreable;
	const hasErrors = allDiagnostics.some((d) => d.severity === "error");
	const missingTools = collectMissingTools(results);
	const exitCode = computeScanExitCode({
		hasErrors,
		scoreable,
		score: scoreResult.score,
		failBelow: config.ci.failBelow,
		missingTools: missingTools.length > 0,
		failOnMissingTools: config.ci.failOnMissingTools,
		newFindings: baselineSummary?.new,
	});

	const completion = buildCompletion(results, exitCode, scoreable ? scoreResult.score : null);

	const output = {
		prepared,
		config,
		options,
		results,
		scoreResult,
		scanCoverage,
		elapsedMs,
		missingTools,
		baselineSummary,
		includeHeader: !printedHumanHeader && showHeader,
		counts: completion,
	};
	if (!(await writeMachineOutput(output))) writeHumanOutput(output);

	return completion;
};
