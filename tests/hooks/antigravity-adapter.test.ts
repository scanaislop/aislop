import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractAntigravityFiles,
	formatAntigravityMessage,
	parseAntigravityStdin,
	renderAntigravityOutput,
	resolveAntigravityCwd,
	runAntigravityHook,
} from "../../src/hooks/adapters/antigravity.js";
import type { AislopFeedback } from "../../src/hooks/feedback.js";

const { spawnSync } = vi.hoisted(() => ({
	spawnSync: vi.fn(() => {
		throw new Error("automatic hook scans must not spawn subprocesses");
	}),
}));

vi.mock("node:child_process", () => ({ spawnSync }));

const baseFeedback = (overrides: Partial<AislopFeedback> = {}): AislopFeedback => ({
	schema: "aislop.hook.v2",
	score: 100,
	regressed: false,
	counts: { error: 0, warning: 0, fixable: 0, total: 0 },
	findings: [],
	nextSteps: [],
	suggestedActions: [],
	...overrides,
});

describe("parseAntigravityStdin", () => {
	it("returns {} for empty or whitespace input", () => {
		expect(parseAntigravityStdin("")).toEqual({});
		expect(parseAntigravityStdin("   ")).toEqual({});
	});

	it("returns {} for malformed JSON", () => {
		expect(parseAntigravityStdin("not json")).toEqual({});
	});

	it("parses write_file toolCall payload", () => {
		const raw = JSON.stringify({
			conversationId: "test-conv-123",
			cwd: "/project",
			toolCall: {
				id: "call_1",
				name: "write_file",
				args: { Path: "/project/src/index.ts", Content: "console.log('test')" },
			},
			result: "File written successfully.",
		});
		const parsed = parseAntigravityStdin(raw);
		expect(parsed.conversationId).toBe("test-conv-123");
		expect(parsed.cwd).toBe("/project");
		expect(parsed.toolCall?.name).toBe("write_file");
		expect(parsed.toolCall?.args?.Path).toBe("/project/src/index.ts");
		expect(parsed.result).toBe("File written successfully.");
	});
});

describe("extractAntigravityFiles", () => {
	it("extracts Path (PascalCase)", () => {
		const files = extractAntigravityFiles({
			toolCall: { name: "write_file", args: { Path: "/a/b.ts" } },
		});
		expect(files).toEqual(["/a/b.ts"]);
	});

	it("extracts path (camelCase)", () => {
		const files = extractAntigravityFiles({
			toolCall: { name: "edit_file", args: { path: "/a/c.ts" } },
		});
		expect(files).toEqual(["/a/c.ts"]);
	});

	it("returns empty array when toolCall has no args or Path", () => {
		expect(extractAntigravityFiles({})).toEqual([]);
		expect(extractAntigravityFiles({ toolCall: {} })).toEqual([]);
		expect(extractAntigravityFiles({ toolCall: { args: {} } })).toEqual([]);
	});
});

describe("resolveAntigravityCwd", () => {
	it("prioritizes input.cwd when absolute", () => {
		expect(resolveAntigravityCwd({ cwd: "/home/user/my-repo" })).toBe("/home/user/my-repo");
	});

	it("falls back to workspacePaths[0] if cwd is missing", () => {
		expect(
			resolveAntigravityCwd({ workspacePaths: ["/home/user/ws-repo"] }),
		).toBe("/home/user/ws-repo");
	});
});

describe("formatAntigravityMessage", () => {
	it("formats findings and preserves original result prefix", () => {
		const feedback = baseFeedback({
			score: 85,
			baseline: 95,
			delta: -10,
			counts: { error: 1, warning: 1, fixable: 0, total: 2 },
			findings: [
				{
					ruleId: "ts/no-explicit-any",
					severity: "error",
					category: "TypeSafety",
					file: "src/index.ts",
					line: 14,
					message: "Unsafe any cast",
				},
				{
					ruleId: "ts/no-empty-catch",
					severity: "warning",
					category: "Defensive",
					file: "src/index.ts",
					line: 25,
					message: "Swallowed error in catch block",
				},
			],
			nextSteps: ["Fix 1 error before the next turn."],
		});

		const message = formatAntigravityMessage(feedback, "File edited successfully.");
		expect(message).toContain("File edited successfully.");
		expect(message).toContain("[aislop] Score: 85/100 (-10) (baseline: 95). 1 error, 1 warning.");
		expect(message).toContain("src/index.ts:14 [error] ts/no-explicit-any: Unsafe any cast");
		expect(message).toContain("src/index.ts:25 [warning] ts/no-empty-catch: Swallowed error");
		expect(message).toContain("Next steps:\n  • Fix 1 error before the next turn.");
	});
});

describe("renderAntigravityOutput", () => {
	it("returns {} when message is empty or omitted", () => {
		expect(renderAntigravityOutput()).toEqual({});
		expect(renderAntigravityOutput("")).toEqual({});
	});

	it("returns overwriteResult when message is provided", () => {
		expect(renderAntigravityOutput("Notice: issues found")).toEqual({
			overwriteResult: "Notice: issues found",
		});
	});
});

describe("runAntigravityHook (integration)", () => {
	let cwd: string;

	beforeEach(() => {
		cwd = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-ag-"));
	});

	afterEach(() => {
		spawnSync.mockClear();
		fs.rmSync(cwd, { recursive: true, force: true });
	});

	it("emits {} on a clean file", async () => {
		const file = path.join(cwd, "clean.ts");
		fs.writeFileSync(file, "export const x = 1;\n");

		let written = "";
		const exitCode = await runAntigravityHook({
			stdin: async () =>
				JSON.stringify({
					cwd,
					toolCall: {
						name: "write_file",
						args: { Path: file },
					},
					result: "File written successfully.",
				}),
			write: (s) => {
				written += s;
			},
		});

		expect(exitCode).toBe(0);
		expect(written).toBe(JSON.stringify({}));
	});

	it("emits overwriteResult when finding issues", async () => {
		fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ name: "test-project" }));
		fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
		fs.writeFileSync(path.join(cwd, "src", "app.ts"), "export const value = true;\n");
		const file = path.join(cwd, "src", "app.test.ts");
		fs.writeFileSync(file, "it('passes', () => expect(true).toBe(true));\n");

		let written = "";
		const exitCode = await runAntigravityHook({
			stdin: async () =>
				JSON.stringify({
					cwd,
					toolCall: {
						name: "write_file",
						args: { Path: file },
					},
					result: "File written successfully.",
				}),
			write: (s) => {
				written += s;
			},
		});

		expect(exitCode).toBe(0);
		const parsed = JSON.parse(written) as { overwriteResult?: string };
		expect(parsed.overwriteResult).toBeDefined();
		expect(parsed.overwriteResult).toContain("[aislop]");
		expect(parsed.overwriteResult).toContain("File written successfully.");
	});

	it("exits 0 and does not write when tool errored", async () => {
		let written = "";
		const exitCode = await runAntigravityHook({
			stdin: async () =>
				JSON.stringify({
					cwd,
					toolCall: {
						name: "write_file",
						args: { Path: path.join(cwd, "missing.ts") },
					},
					error: "Permission denied",
				}),
			write: (s) => {
				written += s;
			},
		});

		expect(exitCode).toBe(0);
		expect(written).toBe("");
	});
});
