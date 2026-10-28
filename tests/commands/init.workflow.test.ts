import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ui/prompts.js", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../src/ui/prompts.js")>()),
	select: vi.fn(async () => "overwrite"),
}));

import { initCommand, writeGithubWorkflow } from "../../src/commands/init.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-init-workflow-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("writeGithubWorkflow", () => {
	it("writes .github/workflows/aislop.yml when enabled and none exists", () => {
		const result = writeGithubWorkflow(tmpDir, true);
		expect(result.status).toBe("written");
		if (result.status === "written") {
			expect(result.relativePath).toBe(".github/workflows/aislop.yml");
		}
		const body = fs.readFileSync(path.join(tmpDir, ".github/workflows/aislop.yml"), "utf-8");
		expect(body).toContain("name: aislop");
		expect(body).toContain("uses: scanaislop/aislop@v1");
		expect(body).toContain("version: latest");
	});

	it("returns declined (no write) when disabled", () => {
		const result = writeGithubWorkflow(tmpDir, false);
		expect(result.status).toBe("declined");
		expect(fs.existsSync(path.join(tmpDir, ".github/workflows/aislop.yml"))).toBe(false);
	});

	it("skips without overwriting if the file already exists", () => {
		const workflowPath = path.join(tmpDir, ".github/workflows/aislop.yml");
		fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
		fs.writeFileSync(workflowPath, "# user's own workflow\n");
		const result = writeGithubWorkflow(tmpDir, true);
		expect(result.status).toBe("skipped-exists");
		expect(fs.readFileSync(workflowPath, "utf-8")).toBe("# user's own workflow\n");
	});
});

describe("init --strict", () => {
	it("writes a strict config, architecture rules, and CI workflow without prompting", async () => {
		await initCommand(tmpDir, { strict: true, printBrand: false });

		const config = fs.readFileSync(path.join(tmpDir, ".aislop/config.yml"), "utf-8");
		expect(config).toContain("architecture: true");
		expect(config).toContain("typecheck: true");
		expect(config).toContain("expoDoctor: false");
		expect(config).toContain("failBelow: 85");
		expect(fs.existsSync(path.join(tmpDir, ".aislop/rules.yml"))).toBe(true);
		expect(fs.existsSync(path.join(tmpDir, ".github/workflows/aislop.yml"))).toBe(true);
	});

	it("overwrites an existing .yaml config instead of adding a .yml next to it", async () => {
		fs.mkdirSync(path.join(tmpDir, ".aislop"));
		fs.writeFileSync(path.join(tmpDir, ".aislop/config.yaml"), "version: 1\n");
		fs.writeFileSync(path.join(tmpDir, ".aislop/rules.yaml"), "rules: []\n");

		await initCommand(tmpDir, { strict: true, printBrand: false });

		expect(fs.existsSync(path.join(tmpDir, ".aislop/config.yml"))).toBe(false);
		expect(fs.existsSync(path.join(tmpDir, ".aislop/rules.yml"))).toBe(false);
		expect(fs.readFileSync(path.join(tmpDir, ".aislop/config.yaml"), "utf-8")).toContain("failBelow: 85");
		expect(fs.readFileSync(path.join(tmpDir, ".aislop/rules.yaml"), "utf-8")).toBe("rules: []\n");
	});
});
