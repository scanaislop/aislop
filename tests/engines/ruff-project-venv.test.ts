import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import { fixRuffFormat, runRuffFormat } from "../../src/engines/format/ruff-format.js";
import { fixRuffLint, fixRuffLintForce, runRuffLint } from "../../src/engines/lint/ruff.js";
import type { EngineContext } from "../../src/engines/types.js";
import { isToolAvailable, resolveToolBinary } from "../../src/utils/tooling.js";

const isWindows = process.platform === "win32";

const initGitRepo = (directory: string): void => {
	spawnSync("git", ["init", "-q"], { cwd: directory, stdio: "ignore" });
};

const venvRuffPath = (rootDirectory: string, venvDir: string): string =>
	isWindows
		? path.join(rootDirectory, venvDir, "Scripts", "ruff.exe")
		: path.join(rootDirectory, venvDir, "bin", "ruff");

const writeExecutable = (filePath: string, content: string): string => {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content, { mode: 0o755 });
	return filePath;
};

const fakeRuffScript = (logFile: string, label: string): string => `#!/usr/bin/env node
require("node:fs").appendFileSync(${JSON.stringify(logFile)}, ${JSON.stringify(label)} + "\\n");
if (process.argv.includes("check") && process.argv.includes("--output-format=json")) {
  process.stdout.write("[]");
}
process.exit(0);
`;

describe("resolveToolBinary with a project root", () => {
	let tmpDir: string;
	let originalPath: string | undefined;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-ruff-venv-resolve-"));
		initGitRepo(tmpDir);
		originalPath = process.env.PATH;
	});

	afterEach(() => {
		process.env.PATH = originalPath;
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("prefers the project's .venv ruff over one on PATH", () => {
		const projectRuff = writeExecutable(venvRuffPath(tmpDir, ".venv"), "");
		const pathDir = path.join(tmpDir, "path-bin");
		writeExecutable(path.join(pathDir, isWindows ? "ruff.exe" : "ruff"), "");
		process.env.PATH = [pathDir, originalPath ?? ""].join(path.delimiter);

		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).toBe(projectRuff);
	});

	it("finds ruff in a venv directory and prefers .venv when both exist", () => {
		const venvRuff = writeExecutable(venvRuffPath(tmpDir, "venv"), "");
		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).toBe(venvRuff);

		const dotVenvRuff = writeExecutable(venvRuffPath(tmpDir, ".venv"), "");
		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).toBe(dotVenvRuff);
	});

	it("ignores the project venv when no project root is given", () => {
		const projectRuff = writeExecutable(venvRuffPath(tmpDir, ".venv"), "");
		expect(resolveToolBinary("ruff")).not.toBe(projectRuff);
	});

	it.skipIf(isWindows)("ignores a non-executable venv entry", () => {
		const projectRuff = venvRuffPath(tmpDir, ".venv");
		fs.mkdirSync(path.dirname(projectRuff), { recursive: true });
		fs.writeFileSync(projectRuff, "", { mode: 0o644 });

		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).not.toBe(projectRuff);
	});
});

describe.skipIf(isWindows)("ruff engines use the project's venv ruff", () => {
	let tmpDir: string;
	let logFile: string;
	let originalPath: string | undefined;

	const buildContext = (allowProjectLocalTools?: boolean): EngineContext => ({
		rootDirectory: tmpDir,
		languages: ["python"],
		frameworks: [],
		files: [path.join(tmpDir, "pkg", "main.py")],
		installedTools: { ruff: true },
		config: {
			quality: DEFAULT_CONFIG.quality,
			security: DEFAULT_CONFIG.security,
			lint: DEFAULT_CONFIG.lint,
			...(allowProjectLocalTools === undefined ? {} : { allowProjectLocalTools }),
		},
	});

	const invokedBinaries = (): string[] =>
		fs.readFileSync(logFile, "utf-8").trim().split("\n");

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-ruff-venv-engine-"));
		initGitRepo(tmpDir);
		logFile = path.join(tmpDir, "invocations.log");
		fs.mkdirSync(path.join(tmpDir, "pkg"));
		fs.writeFileSync(path.join(tmpDir, "pkg", "main.py"), "x = 1\n");
		writeExecutable(venvRuffPath(tmpDir, ".venv"), fakeRuffScript(logFile, "venv"));
		const pathDir = path.join(tmpDir, "path-bin");
		writeExecutable(path.join(pathDir, "ruff"), fakeRuffScript(logFile, "path"));
		originalPath = process.env.PATH;
		process.env.PATH = `${pathDir}${path.delimiter}${originalPath ?? ""}`;
	});

	afterEach(() => {
		process.env.PATH = originalPath;
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("runs the venv ruff for format and lint, in scan and fix", async () => {
		const context = buildContext();

		await runRuffFormat(context);
		await runRuffLint(context);
		await fixRuffFormat(context);
		await fixRuffLint(context);
		await fixRuffLintForce(context);

		expect(invokedBinaries()).toEqual(["venv", "venv", "venv", "venv", "venv"]);
	});

	it("does not run the venv ruff when project-local tools are disallowed", async () => {
		const context = buildContext(false);

		await runRuffFormat(context);
		await runRuffLint(context);
		await fixRuffFormat(context);
		await fixRuffLint(context);

		expect(invokedBinaries()).toEqual(["path", "path", "path", "path"]);
	});
});

describe("project venv lookup is limited to ruff", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-venv-other-tool-"));
		initGitRepo(tmpDir);
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("does not resolve or detect golangci-lint from the project venv", async () => {
		const venvBinary = isWindows
			? path.join(tmpDir, ".venv", "Scripts", "golangci-lint.exe")
			: path.join(tmpDir, ".venv", "bin", "golangci-lint");
		writeExecutable(venvBinary, "");

		expect(resolveToolBinary("golangci-lint", { projectRoot: tmpDir })).not.toBe(venvBinary);
		expect(await isToolAvailable("golangci-lint", tmpDir)).toBe(
			await isToolAvailable("golangci-lint"),
		);
	});
});

describe.skipIf(isWindows)("untrusted project venv ruff", () => {
	let tmpDir: string;

	const runGit = (...args: string[]): void => {
		spawnSync("git", args, { cwd: tmpDir, stdio: "ignore" });
	};

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-venv-untrusted-"));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("does not run a venv ruff outside a git work tree", () => {
		const projectRuff = writeExecutable(venvRuffPath(tmpDir, ".venv"), "");

		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).not.toBe(projectRuff);
	});

	it("does not run a venv ruff that is committed to the repository", () => {
		const projectRuff = writeExecutable(venvRuffPath(tmpDir, ".venv"), "");
		runGit("init", "-q");
		runGit("add", "-f", ".venv/bin/ruff");

		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).not.toBe(projectRuff);
	});

	it("runs an untracked venv ruff inside a repository", () => {
		const projectRuff = writeExecutable(venvRuffPath(tmpDir, ".venv"), "");
		runGit("init", "-q");

		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).toBe(projectRuff);
	});

	it("does not follow a symlinked venv directory", () => {
		const elsewhere = path.join(tmpDir, "elsewhere");
		writeExecutable(path.join(elsewhere, "bin", "ruff"), "");
		fs.symlinkSync(elsewhere, path.join(tmpDir, ".venv"));

		expect(resolveToolBinary("ruff", { projectRoot: tmpDir })).not.toBe(
			venvRuffPath(tmpDir, ".venv"),
		);
	});
});
