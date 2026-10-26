import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runClaudeHook } from "../../src/hooks/adapters/claude.js";
import { runPiHook } from "../../src/hooks/adapters/pi.js";
import { resolveHookRoot } from "../../src/hooks/io/project-root.js";

let tmp: string;

const mkdir = (...parts: string[]): string => {
	const dir = path.join(tmp, ...parts);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
};

const write = (rel: string, content: string): string => {
	const file = path.join(tmp, rel);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
	return file;
};

beforeEach(() => {
	tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "aislop-hook-root-")));
});

afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(tmp, { recursive: true, force: true });
});

describe("resolveHookRoot", () => {
	it("prefers the nearest directory whose .aislop holds project config", () => {
		mkdir(".git");
		write(".aislop/config.yml", "");
		write("packages/a/.aislop/config.yml", "");
		expect(resolveHookRoot(mkdir("docs", "deep"))).toBe(tmp);
		expect(resolveHookRoot(mkdir("packages", "a", "src"))).toBe(path.join(tmp, "packages", "a"));
	});

	it("falls back to the git root when no .aislop config exists", () => {
		mkdir(".git");
		expect(resolveHookRoot(mkdir("docs"))).toBe(tmp);
	});

	it("ignores a stray nested .aislop left behind by older hooks", () => {
		mkdir(".git");
		write(".aislop/baseline.json", "{}");
		write("docs/.aislop/session.jsonl", "");
		expect(resolveHookRoot(path.join(tmp, "docs"))).toBe(tmp);
	});

	it("never treats the home directory's .aislop as the project", () => {
		vi.spyOn(os, "homedir").mockReturnValue(tmp);
		write(".aislop/config.yml", "");
		write(".aislop/install_id", "x");
		mkdir("proj", ".git");
		expect(resolveHookRoot(mkdir("proj", "docs"))).toBe(path.join(tmp, "proj"));
	});

	it("stops at the git root instead of walking into parent projects", () => {
		write(".aislop/config.yml", "");
		mkdir("inner", ".git");
		expect(resolveHookRoot(mkdir("inner", "src"))).toBe(path.join(tmp, "inner"));
	});

	it("returns the directory itself outside any repository", () => {
		const dir = mkdir("loose");
		expect(resolveHookRoot(dir)).toBe(dir);
	});
});

describe("hooks run from a nested cwd", () => {
	beforeEach(() => {
		mkdir(".git");
		mkdir(".aislop");
		write("package.json", '{"name":"demo","version":"1.0.0"}');
	});

	it("keeps session state at the project root", async () => {
		const file = write("docs/a.ts", "export const a = 1;\n");
		await runClaudeHook({
			stdin: async () =>
				JSON.stringify({ tool_input: { file_path: file }, cwd: path.join(tmp, "docs") }),
			write: () => undefined,
		});
		expect(fs.existsSync(path.join(tmp, "docs", ".aislop"))).toBe(false);
		expect(fs.existsSync(path.join(tmp, ".aislop", "session.jsonl"))).toBe(true);
	});

	it("resolves a relative file path against the agent's cwd", async () => {
		write("docs/x.ts", "export const a = 1;\n");
		await runPiHook({
			stdin: async () => JSON.stringify({ cwd: path.join(tmp, "docs"), file_path: "x.ts" }),
			write: () => undefined,
		});
		const session = fs.readFileSync(path.join(tmp, ".aislop", "session.jsonl"), "utf-8");
		expect(session).toContain("x.ts");
		expect(fs.existsSync(path.join(tmp, "docs", ".aislop"))).toBe(false);
	});
});
