import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fixJavaFormat, runJavaFormat } from "../../src/engines/format/java-format.js";
import { detectJavaFormatStyle } from "../../src/engines/java-targets.js";
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
	const script = path.join(binDir, "google-java-format");
	fs.writeFileSync(
		script,
		`#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(logFile)}, process.argv.slice(2).join(" ") + "\\n");
for (const arg of process.argv.slice(2)) if (arg.endsWith("Bad.java")) console.log(arg);
`,
		{ mode: 0o755 },
	);
};

const context = (files: string[]): EngineContext => ({
	rootDirectory: root,
	languages: ["java"],
	frameworks: [],
	files,
	installedTools: { "google-java-format": true },
	config: {
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
		lint: { typecheck: false, expoDoctor: false },
	},
});

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-format-"));
	binDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-bin-"));
	originalPath = process.env.PATH;
	process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ""}`;
});

afterEach(() => {
	process.env.PATH = originalPath;
	fs.rmSync(root, { recursive: true, force: true });
	fs.rmSync(binDir, { recursive: true, force: true });
});

describe("google-java-format style detection", () => {
	it("is off unless the build opts into google-java-format", () => {
		write("pom.xml", "<project><artifactId>app</artifactId></project>");
		expect(detectJavaFormatStyle(root)).toBeNull();
	});

	it("detects Spotless googleJavaFormat in Maven and Gradle, and the AOSP style", () => {
		write("pom.xml", "<java><googleJavaFormat/></java>");
		expect(detectJavaFormatStyle(root)).toBe("google");

		write("pom.xml", "<java><googleJavaFormat><style>AOSP</style></googleJavaFormat></java>");
		expect(detectJavaFormatStyle(root)).toBe("aosp");

		fs.rmSync(path.join(root, "pom.xml"));
		write("build.gradle.kts", 'spotless { java { googleJavaFormat("1.37.0").aosp() } }');
		expect(detectJavaFormatStyle(root)).toBe("aosp");
	});

	it("detects fmt-maven-plugin, which runs google-java-format", () => {
		write("pom.xml", "<plugin><artifactId>fmt-maven-plugin</artifactId></plugin>");
		expect(detectJavaFormatStyle(root)).toBe("google");
	});
});

describe.skipIf(process.platform === "win32")("Java format engine", () => {
	it("reports only the files google-java-format would change", async () => {
		const logFile = path.join(binDir, "calls.log");
		fakeFormatter(logFile);
		write("pom.xml", "<java><googleJavaFormat/></java>");
		const bad = write("src/Bad.java", "class Bad{}");
		const good = write("src/Good.java", "class Good {}\n");

		const diagnostics = await runJavaFormat(context([bad, good]));
		expect(diagnostics.map((d) => [d.rule, d.filePath])).toEqual([
			["java-formatting", "src/Bad.java"],
		]);
		expect(fs.readFileSync(logFile, "utf-8")).toContain("--dry-run src/Bad.java src/Good.java");
	});

	it("passes --aosp and --replace when fixing an AOSP project", async () => {
		const logFile = path.join(binDir, "calls.log");
		fakeFormatter(logFile);
		write("build.gradle", "spotless { java { googleJavaFormat().aosp() } }");
		const bad = write("src/Bad.java", "class Bad{}");

		await fixJavaFormat(context([bad]));
		expect(fs.readFileSync(logFile, "utf-8").trim()).toBe("--aosp --replace src/Bad.java");
	});

	it("does nothing when the project does not use google-java-format", async () => {
		const logFile = path.join(binDir, "calls.log");
		fakeFormatter(logFile);
		const bad = write("src/Bad.java", "class Bad{}");

		expect(await runJavaFormat(context([bad]))).toEqual([]);
		expect(fs.existsSync(logFile)).toBe(false);
	});
});
