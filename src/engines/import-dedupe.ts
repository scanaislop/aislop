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

export const dedupeUnusedImports = (results: EngineResult[]): EngineResult[] => {
	const lintImports = new Set(
		results.filter((r) => r.engine === "lint").flatMap((r) => r.diagnostics.map(importKey)),
	);
	return results.map((result) =>
		result.engine !== "ai-slop"
			? result
			: {
					...result,
					diagnostics: result.diagnostics.filter((finding) => {
						const key = importKey(finding);
						return !key || !lintImports.has(key);
					}),
				},
	);
};
