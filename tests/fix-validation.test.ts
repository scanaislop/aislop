import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { fixCommand } from "../src/commands/fix.js";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import type { AislopConfig } from "../src/config/index.js";

const config: AislopConfig = {
	...DEFAULT_CONFIG,
	telemetry: { enabled: false },
};

let tmpDirs: string[] = [];

afterEach(() => {
	for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
	tmpDirs = [];
});

const mkTmp = (): string => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-fix-validation-"));
	tmpDirs.push(dir);
	return dir;
};

describe("fixCommand input validation", () => {
	it("rejects a missing path with exit 1", async () => {
		const missing = path.join(mkTmp(), "does-not-exist");
		const result = await fixCommand(missing, config, { verbose: false });
		expect(result.exitCode).toBe(1);
	});

	it("rejects a file path (not a directory) with exit 1", async () => {
		const root = mkTmp();
		const file = path.join(root, "file.txt");
		fs.writeFileSync(file, "hello", "utf-8");
		const result = await fixCommand(file, config, { verbose: false });
		expect(result.exitCode).toBe(1);
	});

	it("rejects --dry-run combined with an agent handoff", async () => {
		const root = mkTmp();
		const result = await fixCommand(root, config, {
			verbose: false,
			dryRun: true,
			agent: "claude",
		});
		expect(result.exitCode).toBe(1);
	});

	it("rejects --dry-run combined with --prompt", async () => {
		const root = mkTmp();
		const result = await fixCommand(root, config, {
			verbose: false,
			dryRun: true,
			prompt: true,
		});
		expect(result.exitCode).toBe(1);
	});

	it("rejects --changes combined with --staged", async () => {
		const root = mkTmp();
		const result = await fixCommand(root, config, {
			verbose: false,
			changes: true,
			staged: true,
		});
		expect(result.exitCode).toBe(1);
	});
});
