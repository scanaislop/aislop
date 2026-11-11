import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fixScalaFormat, runScalaFormat } from "../../src/engines/format/scala-format.js";
import { hasScalafmtConfig } from "../../src/engines/scala-targets.js";
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

const fakeFormatter = (logFile: string): void => {
	const script = path.join(binDir, "scalafmt");
	fs.writeFileSync(
		script,
		`#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(logFile)}, process.argv.slice(2).join(" ") + "\\n");
if (process.argv.includes("--list")) {
	for (const arg of process.argv.slice(2)) if (arg.endsWith("Bad.scala")) console.log(arg);
}
`,
		{ mode: 0o755 },
	);
};

const context = (files: string[]): EngineContext => ({
	rootDirectory: root,
	languages: ["scala"],
	frameworks: [],
	files,
	installedTools: { scalafmt: true },
	config: {
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
		lint: { typecheck: false, expoDoctor: false },
	},
});

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-scala-format-"));
	binDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-scala-bin-"));
	originalPath = process.env.PATH;
	process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ""}`;
});

afterEach(() => {
	process.env.PATH = originalPath;
	fs.rmSync(root, { recursive: true, force: true });
	fs.rmSync(binDir, { recursive: true, force: true });
});

describe("Scala format config detection", () => {
	it("detects .scalafmt.conf at the project root", () => {
		expect(hasScalafmtConfig(root)).toBe(false);
		write(".scalafmt.conf", "version = 3.8.3\n");
		expect(hasScalafmtConfig(root)).toBe(true);
	});
});

describe("runScalaFormat", () => {
	it("reports files the formatter lists as unformatted", async () => {
		write(".scalafmt.conf", "version = 3.8.3\n");
		const logFile = path.join(root, "invocations.log");
		fakeFormatter(logFile);
		const good = write("src/Good.scala", "object Good\n");
		const bad = write("src/Bad.scala", "object   Bad\n");

		const diagnostics = await runScalaFormat(context([good, bad]));

		expect(diagnostics.map((d) => `${d.rule}:${d.filePath}`)).toEqual([
			"scala-formatting:src/Bad.scala",
		]);
		expect(fs.readFileSync(logFile, "utf-8")).toContain("--list");
	});

	it("does nothing without a .scalafmt.conf", async () => {
		const logFile = path.join(root, "invocations.log");
		fakeFormatter(logFile);
		const bad = write("src/Bad.scala", "object   Bad\n");

		const diagnostics = await runScalaFormat(context([bad]));

		expect(diagnostics).toEqual([]);
		expect(fs.existsSync(logFile)).toBe(false);
	});
});

describe("fixScalaFormat", () => {
	it("invokes scalafmt on the targets", async () => {
		write(".scalafmt.conf", "version = 3.8.3\n");
		const logFile = path.join(root, "invocations.log");
		fakeFormatter(logFile);
		const bad = write("src/Bad.scala", "object   Bad\n");

		await fixScalaFormat(context([bad]));

		const log = fs.readFileSync(logFile, "utf-8");
		expect(log).toContain("src/Bad.scala");
		expect(log).not.toContain("--list");
	});
});
