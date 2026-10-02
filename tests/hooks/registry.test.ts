import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	AGENTS_PROJECT_ONLY,
	AGENTS_SUPPORTING_BOTH_SCOPES,
	ALL_AGENTS,
	defaultScopeFor,
	detectAislopHooks,
	detectInstalledAgents,
	REGISTRY,
} from "../../src/hooks/install/registry.js";

let home: string;
let cwd: string;

beforeEach(() => {
	home = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-home-"));
	cwd = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-cwd-"));
});

afterEach(() => {
	fs.rmSync(home, { recursive: true, force: true });
	fs.rmSync(cwd, { recursive: true, force: true });
});

describe("agent registry", () => {
	it("covers every declared agent with install + uninstall + paths", () => {
		for (const agent of ALL_AGENTS) {
			expect(REGISTRY[agent]).toBeDefined();
			expect(typeof REGISTRY[agent].install).toBe("function");
			expect(typeof REGISTRY[agent].uninstall).toBe("function");
			expect(typeof REGISTRY[agent].paths).toBe("function");
		}
	});

	it("partitions agents into both-scope and project-only with no overlap", () => {
		for (const agent of AGENTS_PROJECT_ONLY) {
			expect(AGENTS_SUPPORTING_BOTH_SCOPES).not.toContain(agent);
		}
		for (const agent of AGENTS_SUPPORTING_BOTH_SCOPES) {
			expect(AGENTS_PROJECT_ONLY).not.toContain(agent);
		}
		const union = new Set([...AGENTS_PROJECT_ONLY, ...AGENTS_SUPPORTING_BOTH_SCOPES]);
		expect(union.size).toBe(ALL_AGENTS.length);
	});

	it("defaultScopeFor returns 'project' for project-only agents", () => {
		for (const agent of AGENTS_PROJECT_ONLY) {
			expect(defaultScopeFor(agent)).toBe("project");
		}
	});

	it("defaultScopeFor returns 'global' for both-scope agents", () => {
		for (const agent of AGENTS_SUPPORTING_BOTH_SCOPES) {
			expect(defaultScopeFor(agent)).toBe("global");
		}
	});
});

describe("detectInstalledAgents", () => {
	it("returns empty array when no agent config exists", () => {
		const installed = detectInstalledAgents({ home, cwd });
		expect(installed).toEqual([]);
	});

	it("detects Claude when its settings.json exists", () => {
		const claudeDir = path.join(home, ".claude");
		fs.mkdirSync(claudeDir, { recursive: true });
		fs.writeFileSync(path.join(claudeDir, "settings.json"), "{}");
		const installed = detectInstalledAgents({ home, cwd });
		expect(installed).toContain("claude");
	});

	it("detects Windsurf from .windsurfrules in cwd", () => {
		fs.writeFileSync(path.join(cwd, ".windsurfrules"), "# rules");
		const installed = detectInstalledAgents({ home, cwd });
		expect(installed).toContain("windsurf");
	});

	it("detects Codex from global ~/.codex/AGENTS.md", () => {
		const dir = path.join(home, ".codex");
		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(path.join(dir, "AGENTS.md"), "# rules");
		const installed = detectInstalledAgents({ home, cwd });
		expect(installed).toContain("codex");
	});
});

describe("detectAislopHooks", () => {
	it("ignores agent config that has no aislop hook in it", () => {
		fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
		fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify({ hooks: {} }));
		fs.mkdirSync(path.join(home, ".codex"), { recursive: true });
		fs.writeFileSync(path.join(home, ".codex", "AGENTS.md"), "# my rules\n");
		expect(detectAislopHooks({ home, cwd })).toEqual([]);
	});

	it("detects a JSON hook carrying the aislop sentinel", () => {
		fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
		fs.writeFileSync(
			path.join(home, ".claude", "settings.json"),
			JSON.stringify({
				hooks: {
					PostToolUse: [{ hooks: [{ command: "aislop hook claude", __aislop: { v: 1 } }] }],
				},
			}),
		);
		expect(detectAislopHooks({ home, cwd })).toContain("claude");
	});

	it("detects fenced aislop rules in a markdown rules file", () => {
		fs.mkdirSync(path.join(home, ".codex"), { recursive: true });
		fs.writeFileSync(
			path.join(home, ".codex", "AGENTS.md"),
			"# my rules\n<!-- aislop:begin v1 hash=abc -->\nbody\n<!-- aislop:end v1 -->\n",
		);
		expect(detectAislopHooks({ home, cwd })).toContain("codex");
	});

	it("treats an unreadable hook path as no hook instead of throwing", () => {
		const target = REGISTRY.claude.paths({ home, cwd, scope: "global" })[0];
		fs.mkdirSync(target, { recursive: true });
		expect(() => detectAislopHooks({ home, cwd })).not.toThrow();
		expect(detectAislopHooks({ home, cwd })).not.toContain("claude");
	});

	it("detects a hook installed in the project scope", () => {
		const target = REGISTRY.claude.paths({ home, cwd, scope: "project" })[0];
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(
			target,
			JSON.stringify({ hooks: { PostToolUse: [{ hooks: [{ __aislop: { v: 1 } }] }] } }),
		);
		expect(detectAislopHooks({ home, cwd })).toContain("claude");
	});
});
