import path from "node:path";
import type { AislopConfig } from "../config/index.js";
import { log } from "../ui/logger.js";
import {
	buildScopeExplanation,
	type ScopeExclusionGroup,
	type ScopeExplanation,
} from "../utils/scope-explanation.js";
import { redactHomeInText } from "../utils/scope-path.js";
import { readAislopIgnorePatterns } from "../utils/source-files.js";
import { resolveScanScopeMode, type ScanOptions } from "./scan-options.js";
import { scanTargetError } from "./scan-validation.js";

const LABEL_WIDTH = 28;

const renderCount = (
	label: string,
	count: number,
	examples: readonly string[],
	verbose: boolean,
): string[] => {
	const lines = [`${label.padEnd(LABEL_WIDTH)}${count}`];
	if (!verbose) return lines;
	for (const example of examples) lines.push(`  ${example}`);
	return lines;
};

const renderExclusion = (group: ScopeExclusionGroup, verbose: boolean): string[] =>
	renderCount(group.label, group.count, group.examples, verbose);

export const renderScopeExplanation = (
	report: ScopeExplanation,
	options: { verbose?: boolean } = {},
): string => {
	const verbose = options.verbose === true;
	const lines = [
		"Scope explanation",
		"",
		`${"Project root".padEnd(LABEL_WIDTH)}${report.projectRoot}`,
		`${"Scan mode".padEnd(LABEL_WIDTH)}${report.scanMode}`,
	];
	if (report.baseRef) lines.push(`${"Base ref".padEnd(LABEL_WIDTH)}${report.baseRef}`);
	const languages = report.languages.length > 0 ? report.languages.join(", ") : "none";
	lines.push(`${"Languages".padEnd(LABEL_WIDTH)}${languages}`, "", "Files");
	lines.push(
		...renderCount("Production", report.counts.production, report.samples.production, verbose),
		...renderCount("Test", report.counts.test, report.samples.test, verbose),
		...renderCount("Declaration", report.counts.declaration, report.samples.declaration, verbose),
		...renderCount("Unsupported", report.counts.unsupported, report.samples.unsupported, verbose),
		...renderCount("Excluded", report.counts.excluded, [], verbose),
		"",
		"Exclusions",
	);
	for (const group of report.exclusions) lines.push(...renderExclusion(group, verbose));
	return `${lines.join("\n")}\n`;
};

const scopeExplanationJson = (report: ScopeExplanation): string =>
	`${JSON.stringify(report, null, 2)}\n`;

export const explainScopeCommand = (
	directory: string,
	config: AislopConfig,
	options: ScanOptions,
): number => {
	const resolvedDir = path.resolve(directory);
	const targetError = scanTargetError(resolvedDir, options);
	if (targetError) {
		const message = redactHomeInText(targetError);
		if (options.json) {
			process.stdout.write(`${JSON.stringify({ error: message }, null, 2)}\n`);
		} else {
			log.error(message);
		}
		return 1;
	}
	const report = buildScopeExplanation({
		aislopIgnore: readAislopIgnorePatterns(resolvedDir),
		include: config.include,
		mode: resolveScanScopeMode(options),
		rootDirectory: resolvedDir,
		userExclude: config.exclude,
	});
	process.stdout.write(
		options.json ? scopeExplanationJson(report) : renderScopeExplanation(report, options),
	);
	return 0;
};
