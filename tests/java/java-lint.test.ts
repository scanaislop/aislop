import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	parseCheckstyleOutput,
	parsePmdReport,
	runCheckstyle,
	runPmd,
} from "../../src/engines/lint/java.js";
import type { EngineContext } from "../../src/engines/types.js";

let root: string;
let binDir: string;
let originalPath: string | undefined;

const write = (relative: string, content: string): string => {
	const file = path.join(root, relative);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
	return file;
};

const fakeTool = (name: string, body: string): string => {
	const logFile = path.join(binDir, `${name}.log`);
	fs.writeFileSync(
		path.join(binDir, name),
		`#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logFile)}, JSON.stringify(args) + "\\n");
${body}
`,
		{ mode: 0o755 },
	);
	return logFile;
};

const context = (files: string[]): EngineContext => ({
	rootDirectory: root,
	languages: ["java"],
	frameworks: [],
	files,
	installedTools: { pmd: true, checkstyle: true },
	config: {
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
		lint: { typecheck: false, expoDoctor: false },
	},
});

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-lint-"));
	binDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-lint-bin-"));
	originalPath = process.env.PATH;
	process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ""}`;
});

afterEach(() => {
	process.env.PATH = originalPath;
	fs.rmSync(root, { recursive: true, force: true });
	fs.rmSync(binDir, { recursive: true, force: true });
});

describe("Java lint parsers", () => {
	it("maps PMD JSON violations to diagnostics, with priority 1-2 as errors", () => {
		const report = JSON.stringify({
			files: [
				{
					filename: "src/A.java",
					violations: [
						{ beginline: 3, begincolumn: 5, rule: "CloseResource", ruleset: "Error Prone", priority: 3, description: "Close it" },
						{ beginline: 9, begincolumn: 1, rule: "HardCodedCryptoKey", ruleset: "Security", priority: 2, description: "Key" },
					],
				},
			],
		});
		expect(
			parsePmdReport(report, root).map((d) => [d.rule, d.severity, d.filePath, d.line]),
		).toEqual([
			["pmd/CloseResource", "warning", "src/A.java", 3],
			["pmd/HardCodedCryptoKey", "error", "src/A.java", 9],
		]);
		expect(parsePmdReport("not json", root)).toEqual([]);
	});

	it("parses Checkstyle plain output and resolves symlinked absolute paths", () => {
		const real = fs.realpathSync(root);
		const output = [
			"Starting audit...",
			`[ERROR] ${path.join(real, "src/A.java")}:2:15: Name 'x' must match pattern. [MemberName]`,
			`[WARN] ${path.join(real, "src/B.java")}:7: Line is longer than 100 characters. [LineLength]`,
			"Audit done.",
		].join("\n");
		expect(
			parseCheckstyleOutput(output, root).map((d) => [d.rule, d.severity, d.filePath, d.line, d.column]),
		).toEqual([
			["checkstyle/MemberName", "error", "src/A.java", 2, 15],
			["checkstyle/LineLength", "warning", "src/B.java", 7, 0],
		]);
	});
});

describe.skipIf(process.platform === "win32")("Java lint engines", () => {
	it("runs PMD with the curated rules, or the project's ruleset when present", async () => {
		const logFile = fakeTool("pmd", 'process.stdout.write(JSON.stringify({ files: [] }));');
		const file = write("src/A.java", "class A {}");

		await runPmd(context([file]));
		const curated = JSON.parse(fs.readFileSync(logFile, "utf-8").trim());
		expect(curated[curated.indexOf("-R") + 1]).toContain("category/java/errorprone.xml/CloseResource");

		write("config/pmd/ruleset.xml", "<ruleset/>");
		fs.rmSync(logFile);
		await runPmd(context([file]));
		const own = JSON.parse(fs.readFileSync(logFile, "utf-8").trim());
		expect(own[own.indexOf("-R") + 1]).toBe(path.join(root, "config/pmd/ruleset.xml"));
	});

	it("runs Checkstyle only with the project's own configuration", async () => {
		const logFile = fakeTool("checkstyle", "");
		const file = write("src/A.java", "class A {}");

		expect(await runCheckstyle(context([file]))).toEqual([]);
		expect(fs.existsSync(logFile)).toBe(false);

		write("checkstyle.xml", "<module name=\"Checker\"/>");
		await runCheckstyle(context([file]));
		expect(JSON.parse(fs.readFileSync(logFile, "utf-8").trim())).toEqual([
			"-c",
			path.join(root, "checkstyle.xml"),
			"src/A.java",
		]);
	});
});
