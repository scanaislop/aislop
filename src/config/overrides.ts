import path from "node:path";
import micromatch from "micromatch";
import type { Diagnostic, EngineContext } from "../engines/types.js";
import { applyRuleSeverities } from "../scoring/rule-severity.js";
import type { AislopConfig } from "./schema.js";

type FilePolicy = Pick<AislopConfig, "quality"> &
	Partial<Pick<AislopConfig, "rules" | "overrides">>;

export const overrideRelativePath = (rootDirectory: string, filePath: string): string => {
	const paths =
		path.win32.isAbsolute(rootDirectory) && !path.posix.isAbsolute(rootDirectory)
			? path.win32
			: path.posix;
	const root = rootDirectory.replaceAll("\\", "/");
	const file = filePath.replaceAll("\\", "/");
	return paths
		.normalize(paths.isAbsolute(file) ? paths.relative(root, file) : file)
		.replaceAll("\\", "/");
};

const matchesEntry = (relativePath: string, patterns: string[]): boolean => {
	const isExclusion = (pattern: string) => micromatch.scan(pattern).negated;
	const positives = patterns.filter((pattern) => !isExclusion(pattern));
	const negatives = patterns.filter(isExclusion).map((pattern) => pattern.slice(1));
	const included =
		positives.length === 0 || micromatch.isMatch(relativePath, positives, { dot: true });
	const excluded =
		negatives.length > 0 && micromatch.isMatch(relativePath, negatives, { dot: true });
	return included && !excluded;
};

export const resolveFilePolicy = (config: FilePolicy, relativePath: string) => {
	let quality = config.quality;
	let rules = config.rules ?? {};
	if (
		relativePath === ".." ||
		relativePath.startsWith("../") ||
		path.win32.isAbsolute(relativePath)
	) {
		return { quality, rules };
	}
	for (const entry of config.overrides ?? []) {
		if (!matchesEntry(relativePath, entry.files)) continue;
		if (entry.quality) quality = { ...quality, ...entry.quality };
		if (entry.rules) rules = { ...rules, ...entry.rules };
	}
	return { quality, rules };
};

export const applyFileOverrides = (
	diagnostics: Diagnostic[],
	context: EngineContext,
): Diagnostic[] => {
	if (!context.config.overrides?.length) return diagnostics;
	return diagnostics.flatMap((diagnostic) => {
		const relativePath = overrideRelativePath(context.rootDirectory, diagnostic.filePath);
		const { rules } = resolveFilePolicy(context.config, relativePath);
		return applyRuleSeverities([diagnostic], rules);
	});
};
