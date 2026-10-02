import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import { fixRuffFormat, runRuffFormat } from "../../src/engines/format/ruff-format.js";
import { fixRuffLint, runRuffLint } from "../../src/engines/lint/ruff.js";
import type { EngineContext } from "../../src/engines/types.js";
import { resolveToolBinary } from "../../src/utils/tooling.js";

const writeFile = (rootDirectory: string, filePath: string, content: string): string => {
	const absolutePath = path.join(rootDirectory, filePath);
	fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
	fs.writeFileSync(absolutePath, content, "utf-8");
	return absolutePath;
};

const buildContext = (rootDirectory: string, files: string[]): EngineContext => ({
	rootDirectory,
	languages: ["python"],
	frameworks: [],
	files,
	installedTools: { ruff: true },
	config: {
		quality: DEFAULT_CONFIG.quality,
		security: DEFAULT_CONFIG.security,
		lint: DEFAULT_CONFIG.lint,
	},
});

const PROJECT_CONFIG = [
	"[tool.ruff]",
	"line-length = 100",
	'extend-exclude = ["legacy"]',
	"",
	"[tool.ruff.format]",
	'quote-style = "single"',
	"",
].join("\n");

const UNFORMATTED = "def add( a,b ):\n  return a+b\n";

const writeProject = (rootDirectory: string): string[] => {
	writeFile(rootDirectory, "pyproject.toml", PROJECT_CONFIG);
	return [
		writeFile(
			rootDirectory,
			"pkg/main.py",
			"def greet(name):\n    return 'hello ' + name + ' and a fairly long tail of text that ends near ninety'\n",
		),
		writeFile(rootDirectory, "legacy/stub.py", UNFORMATTED),
	];
};

describe.skipIf(process.platform === "win32")("ruff respects the project's exclude settings", () => {
	let tmpDir: string;
	let argsLog: string;
	let originalPath: string | undefined;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-ruff-config-"));
		argsLog = path.join(tmpDir, "ruff-args.log");
		const binDir = path.join(tmpDir, "bin");
		fs.mkdirSync(binDir);
		fs.writeFileSync(
			path.join(binDir, "ruff"),
			`#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(argsLog)}, JSON.stringify(args) + "\\n");
const forceExclude = args.includes("--force-exclude");
const targets = args.filter((arg) => !arg.startsWith("-") && arg !== "check" && arg !== "format");
const flagged = targets.filter((target) => target.includes("legacy/") && !forceExclude);
if (args[0] === "check") {
  process.stdout.write(JSON.stringify(flagged.map((filename) => ({
    code: "E501", message: "Line too long", filename, location: { row: 1, column: 1 },
  }))));
} else if (args.includes("--check")) {
  process.stdout.write(flagged.map((file) => "--- " + file + "\\n+++ " + file + "\\n").join(""));
}
process.exit(flagged.length > 0 ? 1 : 0);
`,
			{ mode: 0o755 },
		);
		originalPath = process.env.PATH;
		process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ""}`;
	});

	afterEach(() => {
		process.env.PATH = originalPath;
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const loggedArgs = (): string[][] =>
		fs
			.readFileSync(argsLog, "utf-8")
			.trim()
			.split("\n")
			.map((line) => JSON.parse(line));

	it("does not report formatting in files the project's ruff config excludes", async () => {
		const files = writeProject(tmpDir);

		expect(await runRuffFormat(buildContext(tmpDir, files))).toEqual([]);
		expect(await runRuffLint(buildContext(tmpDir, files))).toEqual([]);
	});

	it("passes --force-exclude to every scan and fix invocation", async () => {
		const files = writeProject(tmpDir);
		const context = buildContext(tmpDir, files);

		await runRuffFormat(context);
		await runRuffLint(context);
		await fixRuffFormat(context);
		await fixRuffLint(context);

		const invocations = loggedArgs();
		expect(invocations).toHaveLength(4);
		for (const args of invocations) expect(args).toContain("--force-exclude");
	});
});

const realRuff = resolveToolBinary("ruff");
const realRuffAvailable =
	process.platform !== "win32" && path.isAbsolute(realRuff) && fs.existsSync(realRuff);

describe.skipIf(!realRuffAvailable)("ruff format with a real ruff binary", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-ruff-real-"));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("matches the project's own ruff on line length, quote style, and excludes", async () => {
		const files = writeProject(tmpDir);
		const unformatted = writeFile(tmpDir, "pkg/bad.py", UNFORMATTED);

		const diagnostics = await runRuffFormat(buildContext(tmpDir, [...files, unformatted]));

		expect(diagnostics.map((diagnostic) => diagnostic.filePath)).toEqual(["pkg/bad.py"]);
	});
});
