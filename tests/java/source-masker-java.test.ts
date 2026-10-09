import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkComplexity } from "../../src/engines/code-quality/complexity.js";
import type { EngineContext } from "../../src/engines/types.js";
import { maskComments, maskStringsAndComments } from "../../src/utils/source-masker.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-mask-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

const context = (files: string[]): EngineContext => ({
	rootDirectory: tmpDir,
	languages: ["java"],
	frameworks: ["none"],
	files,
	installedTools: {},
	config: {
		quality: { maxFunctionLoc: 10, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
	},
});

describe("Java source masking", () => {
	it("masks strings, chars, and comments while keeping code and line breaks", () => {
		const source = [
			'String s = "a { b"; // trailing {',
			"char c = '{';",
			"/* block { */ int x = 1;",
		].join("\n");
		const masked = maskStringsAndComments(source, ".java");

		expect(masked.split("\n")).toHaveLength(3);
		expect(masked).not.toContain("{");
		expect(masked).toContain("String s =");
		expect(masked).toContain("int x = 1;");
	});

	it("masks text blocks, including escaped quotes and braces", () => {
		const source = ['String json = """', '  {"key": "va\\"""lue"}', '  """;', "int after = 1;"].join(
			"\n",
		);
		const masked = maskStringsAndComments(source, ".java");

		expect(masked).not.toContain("{");
		expect(masked).not.toContain("key");
		expect(masked.split("\n")[3]).toBe("int after = 1;");
	});

	it("keeps string contents when masking comments only", () => {
		const masked = maskComments('String url = "http://x"; // note', ".java");

		expect(masked).toContain('"http://x"');
		expect(masked).not.toContain("note");
	});
});

describe("Java function length", () => {
	it("is not inflated by braces inside strings, text blocks, chars, or comments", async () => {
		const short = [
			"class A {",
			"  void small() {",
			'    String a = "{{{";',
			"    char b = '{';",
			"    // {",
			'    String c = """',
			"      { not code",
			'      """;',
			"  }",
			...Array.from({ length: 3 }, (_, i) =>
				[`  void f${i}() {`, ...Array.from({ length: 8 }, () => "    int x = 1;"), "  }"].join("\n"),
			),
			"}",
			"",
		].join("\n");
		const file = path.join(tmpDir, "A.java");
		fs.writeFileSync(file, short);

		const diagnostics = await checkComplexity(context([file]));
		expect(diagnostics.filter((d) => d.rule === "complexity/function-too-long")).toEqual([]);
	});
});
