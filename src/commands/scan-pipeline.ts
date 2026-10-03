import path from "node:path";
import { type AislopConfig, findConfigDir, RULES_FILE } from "../config/index.js";
import type { EngineConfig, EngineResult } from "../engines/types.js";
import { applyRuleSeverities } from "../scoring/rule-severity.js";
import { detectSourceLanguages, discoverProject, type Language } from "../utils/discover.js";
import { readAislopIgnorePatterns } from "../utils/source-files.js";
import { applySuppressions } from "../utils/suppress.js";
import { runEnginesWithProgress } from "./scan-engine-runner.js";
import { collectScanFileScope, type ScanFileScope, type ScanScopeMode } from "./scan-file-scope.js";

export interface PreparedScan {
	resolvedDir: string;
	excludePatterns: string[];
	scanScope: ScanFileScope;
	projectInfo: Awaited<ReturnType<typeof discoverProject>>;
	dependencyAuditLanguages: Language[];
}

export const prepareScan = async (
	resolvedDir: string,
	config: AislopConfig,
	mode: ScanScopeMode,
): Promise<PreparedScan> => {
	const excludePatterns = [...config.exclude, ...readAislopIgnorePatterns(resolvedDir)];
	const scanScope = collectScanFileScope({
		excludePatterns,
		includePatterns: config.include,
		mode,
		rootDirectory: resolvedDir,
	});
	const discoveredProject = await discoverProject(resolvedDir, excludePatterns, {
		includePatterns: config.include,
	});
	return {
		resolvedDir,
		excludePatterns,
		scanScope,
		projectInfo: {
			...discoveredProject,
			languages: detectSourceLanguages([...scanScope.files, ...scanScope.testFiles]),
		},
		dependencyAuditLanguages: discoveredProject.languages,
	};
};

export const runScanEngines = async (
	prepared: PreparedScan,
	config: AislopConfig,
	machineOutput: boolean,
): Promise<{ results: EngineResult[]; suppressedCount: number }> => {
	const { resolvedDir, scanScope, projectInfo } = prepared;
	const configDir = findConfigDir(resolvedDir);
	const rulesPath = configDir ? path.join(configDir, RULES_FILE) : undefined;
	const engineConfig: EngineConfig = {
		overrides: config.overrides,
		rules: config.rules,
		imports: config.imports,
		quality: config.quality,
		security: config.security,
		lint: config.lint,
		architectureRulesPath: config.engines.architecture ? rulesPath : undefined,
	};

	const rawResults = await runEnginesWithProgress(
		{
			rootDirectory: resolvedDir,
			languages: projectInfo.languages,
			frameworks: projectInfo.frameworks,
			dependencyAuditFiles: scanScope.dependencyAuditFiles,
			dependencyAuditLanguages: prepared.dependencyAuditLanguages,
			dependencyAuditScope: scanScope.dependencyAuditScope,
			files: scanScope.files,
			excludePatterns: prepared.excludePatterns,
			testFiles: scanScope.testFiles,
			projectFiles: scanScope.projectFiles,
			installedTools: projectInfo.installedTools,
			config: engineConfig,
		},
		config.engines,
		machineOutput,
	);

	const severityAdjusted = rawResults.map((result) => ({
		...result,
		diagnostics: config.overrides.length
			? result.diagnostics
			: applyRuleSeverities(result.diagnostics, config.rules),
	}));
	return applySuppressions(severityAdjusted, resolvedDir);
};
