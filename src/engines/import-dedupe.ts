import type { Diagnostic, EngineResult } from "./types.js";

const importKey = (finding: Diagnostic): string | undefined => {
	let symbol: string | undefined;
	switch (finding.rule) {
		case "ai-slop/unused-import":
			symbol = /^Imported symbol '([\w$]+)' is never used$/.exec(finding.message)?.[1];
			break;
		case "eslint/no-unused-vars":
			symbol = /^Identifier '([\w$]+)' is imported but never used\./.exec(finding.message)?.[1];
			break;
		case "ruff/F401":
			symbol = /^`(?:\w+\.)*(\w+)` imported but unused/.exec(finding.message)?.[1];
			break;
	}
	return symbol && `${finding.filePath}:${finding.line}:${symbol}`;
};

const severityRank = { info: 0, warning: 1, error: 2 };

export const dedupeUnusedImports = (results: EngineResult[]): EngineResult[] => {
	const preferred = new Map<string, Diagnostic>();
	for (const { engine, diagnostics } of results) {
		if (engine !== "lint" && engine !== "ai-slop") continue;
		for (const finding of diagnostics) {
			const key = importKey(finding);
			if (!key) continue;
			const previous = preferred.get(key);
			if (
				!previous ||
				severityRank[finding.severity] > severityRank[previous.severity] ||
				(finding.severity === previous.severity && engine === "lint")
			) {
				preferred.set(key, finding);
			}
		}
	}

	return results.map((result) => ({
		...result,
		diagnostics: result.diagnostics.filter((finding) => {
			const key = importKey(finding);
			return !key || !preferred.has(key) || preferred.get(key) === finding;
		}),
	}));
};
