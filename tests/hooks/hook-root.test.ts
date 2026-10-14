import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runClaudeHook } from "../../src/hooks/adapters/claude.js";
import { resolveHookRoot } from "../../src/hooks/io/project-root.js";

let tmp: string;

beforeEach(() => {
	tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "aislop-hook-root-")));
});

afterEach(() => {
	fs.rmSync(tmp, { recursive: true, force: true });
});

describe("resolveHookRoot", () => {
	it("prefers the nearest .aislop directory", () => {
		fs.mkdirSync(path.join(tmp, ".aislop"));
		fs.mkdirSync(path.join(tmp, "docs", "deep"), { recursive: true });
		expect(resolveHookRoot(path.join(tmp, "docs", "deep"))).toBe(tmp);
	});

	it("falls back to the git root, then to the directory itself", () => {
		fs.mkdirSync(path.join(tmp, ".git"));
		fs.mkdirSync(path.join(tmp, "docs"));
		expect(resolveHookRoot(path.join(tmp, "docs"))).toBe(tmp);
	});
});

describe("runClaudeHook from a nested cwd", () => {
	it("keeps session state at the project root", async () => {
		fs.mkdirSync(path.join(tmp, ".aislop"));
		fs.mkdirSync(path.join(tmp, "docs"));
		fs.writeFileSync(path.join(tmp, "package.json"), '{"name":"demo","version":"1.0.0"}');
		const file = path.join(tmp, "docs", "a.ts");
		fs.writeFileSync(file, "export const a = 1;\n");
		await runClaudeHook({
			stdin: async () =>
				JSON.stringify({ tool_input: { file_path: file }, cwd: path.join(tmp, "docs") }),
			write: () => undefined,
		});
		expect(fs.existsSync(path.join(tmp, "docs", ".aislop"))).toBe(false);
		expect(fs.existsSync(path.join(tmp, ".aislop", "session.jsonl"))).toBe(true);
	});
});
