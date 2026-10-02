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
