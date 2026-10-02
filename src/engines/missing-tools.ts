import type { Language } from "../utils/discover.js";
import type { EngineContext, EngineResult } from "./types.js";

type ToolRequirement = readonly [Language, string];

export const FORMAT_TOOL_REQUIREMENTS: readonly ToolRequirement[] = [
	["python", "ruff"],
	["go", "gofmt"],
	["rust", "rustfmt"],
	["ruby", "rubocop"],
	["php", "php-cs-fixer"],
];

export const LINT_TOOL_REQUIREMENTS: readonly ToolRequirement[] = [
	["python", "ruff"],
	["go", "golangci-lint"],
	["rust", "cargo"],
	["ruby", "rubocop"],
];

export const findMissingTools = (
	context: EngineContext,
	requirements: readonly ToolRequirement[],
): string[] => {
	const missing = new Set<string>();
	for (const [language, tool] of requirements) {
		if (context.languages.includes(language) && !context.installedTools[tool]) missing.add(tool);
	}
	return [...missing];
};

export const withMissingTools = (result: EngineResult, missingTools: string[]): EngineResult => {
	if (missingTools.length === 0) return result;
	return {
		...result,
		missingTools,
		...(result.skipped ? { skipReason: `missing tools: ${missingTools.join(", ")}` } : {}),
	};
};

export const collectMissingTools = (results: EngineResult[]): string[] => [
	...new Set(results.flatMap((result) => result.missingTools ?? [])),
];
