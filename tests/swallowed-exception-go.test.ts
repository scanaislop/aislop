import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectSwallowedExceptions } from "../src/engines/ai-slop/exceptions.js";
import type { EngineContext } from "../src/engines/types.js";

let root: string;

const ctx = (): EngineContext => ({
	rootDirectory: root,
	languages: ["go"],
	frameworks: [],
	installedTools: {},
	config: {
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
		lint: { typecheck: false, expoDoctor: false },
	},
});

const write = (name: string, body: string) => {
	const file = path.join(root, name);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, body);
};

const flaggedLines = async (): Promise<string[]> =>
	(await detectSwallowedExceptions(ctx()))
		.filter((d) => d.rule === "ai-slop/swallowed-exception")
		.map((d) => `${d.filePath}:${d.line}`)
		.sort();

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-swgo-"));
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

describe("detectSwallowedExceptions (Go blank identifier)", () => {
	it("flags a dropped error from a function that returns error", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"func load() (string, error) { return \"\", nil }",
				"",
				"func run() {",
				"\tv, _ := load()",
				"\t_ = v",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:6"]);
	});

	it("does not flag a dropped value that is not an error", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"func resolveTarget(name string) (string, string) { return name, \"\" }",
				"",
				"func run() {",
				"\ttarget, _ := resolveTarget(\"x\")",
				"\t_ = target",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual([]);
	});

	it("resolves functions declared in another file of the same package", async () => {
		write(
			"pkg/helpers.go",
			[
				"package pkg",
				"",
				"func split(s string) (head string, tail []string) { return s, nil }",
				"func parse[T any](s string) (v T, err error) { return v, nil }",
			].join("\n"),
		);
		write(
			"pkg/use.go",
			[
				"package pkg",
				"",
				"func use() {",
				"\th, _ := split(\"a\")",
				"\tn, _ := parse[int](\"1\")",
				"\tm, _ = parse(\"2\")",
				"\t_, _, _ = h, n, m",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["pkg/use.go:6"]);
	});

	it("keeps flagging calls whose signature cannot be resolved", async () => {
		write(
			"main.go",
			["package main", "", "func run() {", "\tv, _ := unknownHelper()", "\t_ = v", "}"].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:4"]);
	});

	it("keeps flagging results whose type may be an error", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"type Err = error",
				"type myErr struct{}",
				"",
				"func a() (string, Err) { return \"\", nil }",
				"func b() (string, *myErr) { return \"\", nil }",
				"func c() (string, any) { return \"\", nil }",
				"func d() (n int, ok bool) { return 0, false }",
				"func e() (string, []byte) { return \"\", nil }",
				"",
				"func run() {",
				"\tv1, _ := a()",
				"\tv2, _ := b()",
				"\tv3, _ := c()",
				"\tv4, _ := d()",
				"\tv5, _ := e()",
				"\t_, _, _, _, _ = v1, v2, v3, v4, v5",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:13", "main.go:14", "main.go:15"]);
	});

	it("only resolves declarations from the caller's package", async () => {
		write(
			"pkg/a_test.go",
			["package pkg_test", "", "func load() (string, string) { return \"\", \"\" }"].join("\n"),
		);
		write(
			"pkg/b.go",
			[
				"package pkg",
				"",
				"func load() (string, error) { return \"\", nil }",
				"",
				"func run() {",
				"\tv, _ := load()",
				"\t_ = v",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["pkg/b.go:6"]);
	});

	it("treats conflicting declarations across build variants as unresolved", async () => {
		write(
			"pkg/load_linux.go",
			["package pkg", "", "func load() (string, string) { return \"\", \"\" }"].join("\n"),
		);
		write(
			"pkg/load_other.go",
			["package pkg", "", "func load() (string, error) { return \"\", nil }"].join("\n"),
		);
		write(
			"pkg/use.go",
			["package pkg", "", "func run() {", "\tv, _ := load()", "\t_ = v", "}"].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["pkg/use.go:4"]);
	});

	it("treats a locally shadowed function as unresolved", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"func load() (string, string) { return \"\", \"\" }",
				"",
				"func run() {",
				"\tload := func() (string, error) { return \"\", nil }",
				"\tv, _ := load()",
				"\t_ = v",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:7"]);
	});

	it("ignores declarations inside comments", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"/*",
				"func load() (string, string)",
				"*/",
				"func load() (string, error) { return \"\", nil }",
				"",
				"func run() {",
				"\tv, _ := load()",
				"\t_ = v",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:9"]);
	});

	it("ignores nolint text inside a string literal", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"func load(s string) (int, error) { return 0, nil }",
				"",
				"func run() {",
				'\tv, _ := load("//nolint:errcheck")',
				"\t_ = v",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:6"]);
	});

	it("resolves declarations from every file in the package, whichever is scanned first", async () => {
		write(
			"pkg/a.go",
			[
				"package pkg",
				"",
				"func safe() (int, string) { return 0, \"\" }",
				"func risky() (int, error) { return 0, nil }",
				"",
				"func first() {",
				"\tv, _ := risky()",
				"\t_ = v",
				"}",
			].join("\n"),
		);
		write(
			"pkg/b.go",
			["package pkg", "", "func second() {", "\tv, _ := safe()", "\t_ = v", "}"].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["pkg/a.go:7"]);
	});

	it("limits shadow detection to the enclosing function", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"func safe() (int, string) { return 0, \"\" }",
				"",
				"func other() {",
				"\tsafe := func() (int, error) { return 0, nil }",
				"\t_, _ = safe()",
				"}",
				"",
				"func run() {",
				"\tv, _ := safe()",
				"\t_ = v",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:7"]);
	});

	it("ignores nolint text nested in a block comment", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"func risky() (int, error) { return 0, nil }",
				"",
				"func run() {",
				"\tv, _ := risky() /* //nolint:errcheck */",
				"\tw, _ := risky() /* why */ //nolint:errcheck",
				"\t_, _ = v, w",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:6"]);
	});

	it("honors nolint directives on the line", async () => {
		write(
			"main.go",
			[
				"package main",
				"",
				"func load() (int, error) { return 0, nil }",
				"",
				"func run() {",
				"\ta, _ := load() //nolint:errcheck",
				"\tb, _ := load() //nolint",
				"\tc, _ := load() //nolint:gosec,errcheck // best effort",
				"\td, _ := load() //nolint:gosec",
				"\t_, _, _, _ = a, b, c, d",
				"}",
			].join("\n"),
		);
		expect(await flaggedLines()).toEqual(["main.go:9"]);
	});
});
