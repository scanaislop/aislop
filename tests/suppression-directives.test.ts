import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectUnknownDirectives } from "../src/engines/ai-slop/suppression-directives.js";
import type { Diagnostic, EngineContext, EngineResult } from "../src/engines/types.js";
import { applySuppressions, isAislopDirectiveLine } from "../src/utils/suppress.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-directives-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

const write = (relativePath: string, content: string): string => {
	const absolutePath = path.join(tmpDir, relativePath);
	fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
	fs.writeFileSync(absolutePath, content, "utf-8");
	return absolutePath;
};

const diag = (filePath: string, line: number, rule: string): Diagnostic => ({
	filePath,
	engine: "ai-slop",
	rule,
	severity: "warning",
	message: "x",
	help: "",
	line,
	column: 1,
	category: "AI Slop",
	fixable: false,
});

const wrap = (diagnostics: Diagnostic[]): EngineResult[] => [
	{ engine: "ai-slop", diagnostics, elapsed: 0, skipped: false },
];

const contextFor = (files: string[]): EngineContext => ({
	rootDirectory: tmpDir,
	languages: ["typescript", "python"],
	frameworks: [],
	files,
	installedTools: {},
	config: {
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
		lint: { typecheck: false, expoDoctor: false },
	},
});

describe("bare aislop-ignore", () => {
	it("suppresses every rule on its own line", () => {
		write("a.py", "try:\n    run()\nexcept Exception:  # aislop-ignore\n    pass\n");
		const { results, suppressedCount } = applySuppressions(
			wrap([diag("a.py", 3, "ai-slop/python-broad-except"), diag("a.py", 4, "ai-slop/other")]),
			tmpDir,
		);
		expect(suppressedCount).toBe(1);
		expect(results[0].diagnostics.map((d) => d.line)).toEqual([4]);
	});

	it("scopes to the named rules", () => {
		write("a.ts", "const v = load(); // aislop-ignore ai-slop/hidden-fallback -- validated\n");
		const { results } = applySuppressions(
			wrap([diag("a.ts", 1, "ai-slop/hidden-fallback"), diag("a.ts", 1, "ai-slop/other")]),
			tmpDir,
		);
		expect(results[0].diagnostics.map((d) => d.rule)).toEqual(["ai-slop/other"]);
	});

	it("is recognised as a directive comment", () => {
		expect(isAislopDirectiveLine("# aislop-ignore")).toBe(true);
		expect(isAislopDirectiveLine("// aislop-ignored by design")).toBe(false);
	});
});

describe("unrecognised aislop-ignore directives", () => {
	it("suppresses nothing and is reported with a suggestion", async () => {
		const file = write(
			"a.ts",
			["// aislop-ignore-nextline", "const x = {} || {};", "// aislop-ignore-start"].join("\n"),
		);
		const { suppressedCount } = applySuppressions(
			wrap([diag("a.ts", 2, "ai-slop/empty-fallback")]),
			tmpDir,
		);
		expect(suppressedCount).toBe(0);

		const findings = await detectUnknownDirectives(contextFor([file]));
		expect(findings.map((d) => [d.rule, d.line, d.severity])).toEqual([
			["ai-slop/unknown-directive", 1, "warning"],
			["ai-slop/unknown-directive", 3, "warning"],
		]);
		expect(findings[0].help).toContain("aislop-ignore-next-line");
	});

	it("ignores valid directives and directive-like text in strings", async () => {
		const file = write(
			"a.ts",
			[
				"// aislop-ignore-next-line",
				"const a = 1; // aislop-ignore-line",
				"// aislop-ignore-file duplicate-block",
				'const s = "// aislop-ignore-bogus";',
				"const b = 2; // aislop-ignore",
			].join("\n"),
		);
		expect(await detectUnknownDirectives(contextFor([file]))).toEqual([]);
	});

	it("ignores directive-like lines inside multi-line strings", async () => {
		const ts = write("a.ts", ["const fixture = `", "// aislop-ignore-bogus", "`;"].join("\n"));
		const py = write("b.py", ['DOC = """', "# aislop-ignore-bogus", '"""'].join("\n"));
		expect(await detectUnknownDirectives(contextFor([ts, py]))).toEqual([]);
	});

	it("checks test files", async () => {
		const testFile = write("tests/a.test.ts", "// aislop-ignore-nextline\nexpect(1).toBe(1);\n");
		const context = { ...contextFor([]), testFiles: [testFile] };
		const findings = await detectUnknownDirectives(context);
		expect(findings.map((d) => [d.filePath, d.line])).toEqual([["tests/a.test.ts", 1]]);
	});
});
