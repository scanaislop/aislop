import { describe, expect, it } from "vitest";
import { dedupeOverlappingComments } from "../src/engines/comment-dedupe.js";
import { dedupeUnusedImports } from "../src/engines/import-dedupe.js";
import type { Diagnostic, EngineResult } from "../src/engines/types.js";

const diag = (rule: string, line: number, filePath = "A.cs"): Diagnostic => ({
	filePath,
	engine: "ai-slop",
	rule,
	severity: "info",
	message: "",
	help: "",
	line,
	column: 1,
	category: "AI Slop",
	fixable: false,
});

const aiSlop = (diagnostics: Diagnostic[]): EngineResult => ({
	engine: "ai-slop",
	diagnostics,
	elapsed: 0,
	skipped: false,
});

describe("dedupeOverlappingComments", () => {
	it("keeps a single comment finding when two comment rules hit the same line", () => {
		const out = dedupeOverlappingComments([
			aiSlop([diag("ai-slop/narrative-comment", 5), diag("ai-slop/meta-comment", 5)]),
		]);
		expect(out[0].diagnostics).toHaveLength(1);
	});

	it("keeps both comment findings when they sit on different lines", () => {
		const out = dedupeOverlappingComments([
			aiSlop([diag("ai-slop/narrative-comment", 5), diag("ai-slop/meta-comment", 9)]),
		]);
		expect(out[0].diagnostics).toHaveLength(2);
	});

	it("does not drop a non-comment rule that shares a line with a comment rule", () => {
		const out = dedupeOverlappingComments([
			aiSlop([diag("ai-slop/narrative-comment", 5), diag("ai-slop/csharp-broad-catch", 5)]),
		]);
		expect(out[0].diagnostics).toHaveLength(2);
	});

	it("leaves non-ai-slop engines untouched", () => {
		const lintResult: EngineResult = {
			engine: "lint",
			diagnostics: [diag("dotnet/x", 5), diag("dotnet/x", 5)],
			elapsed: 0,
			skipped: false,
		};
		const out = dedupeOverlappingComments([lintResult]);
		expect(out[0].diagnostics).toHaveLength(2);
	});
});

describe("dedupeUnusedImports", () => {
	it("preserves a configured import error in either engine order", () => {
		const native = aiSlop([
			{
				...diag("ai-slop/unused-import", 1),
				severity: "error",
				message: "Imported symbol 'join' is never used",
			},
		]);
		const lint: EngineResult = {
			...native,
			engine: "lint",
			diagnostics: [
				{
					...diag("eslint/no-unused-vars", 1),
					engine: "lint",
					severity: "warning",
					message: "Identifier 'join' is imported but never used.",
				},
			],
		};
		for (const results of [
			[native, lint],
			[lint, native],
		]) {
			expect(dedupeUnusedImports(results).flatMap((r) => r.diagnostics)).toEqual(
				native.diagnostics,
			);
		}
	});

	it("keeps distinct symbols and falls back to the native finding when lint is absent", () => {
		const native = (name: string) => ({
			...diag("ai-slop/unused-import", 5),
			message: `Imported symbol '${name}' is never used`,
		});
		const rustLint: EngineResult = {
			...aiSlop([]),
			engine: "lint",
			diagnostics: [
				{
					...diag("ruff/F401", 5),
					engine: "lint",
					message: "`pathlib.Path` imported but unused",
				},
			],
		};
		const result = aiSlop([native("Path"), native("Other"), { ...native("Path"), line: 9 }]);
		expect(dedupeUnusedImports([result, rustLint])[0].diagnostics).toEqual(
			result.diagnostics.slice(1),
		);
		expect(dedupeUnusedImports([result])[0].diagnostics).toEqual(result.diagnostics);
	});
});
