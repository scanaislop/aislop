import type { Language } from "../utils/discover.js";
import type { EngineContext, EngineResult } from "./types.js";

export interface ToolRequirement {
	language: Language;
	tool: string;
	label?: string;
	applies?: (context: EngineContext) => boolean;
}

export const findMissingTools = (
	context: EngineContext,
	requirements: readonly ToolRequirement[],
): string[] => {
	const missing = new Set<string>();
	for (const requirement of requirements) {
		if (!context.languages.includes(requirement.language)) continue;
		if (context.installedTools[requirement.tool]) continue;
		if (requirement.applies && !requirement.applies(context)) continue;
		missing.add(requirement.label ?? requirement.tool);
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
