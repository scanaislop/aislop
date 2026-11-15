import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let root: string;
beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-ignore-rules-"));
	fs.writeFileSync(path.join(root, "app.py"), "try:\n    print('debug')\nexcept:\n    raise\n");
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const run = (flags: string[], command = true) => {
	const result = spawnSync(
		process.execPath,
		[path.resolve("dist/cli.js"), ...(command ? ["scan"] : []), root, "--json", ...flags],
		{
			encoding: "utf8",
			env: { ...process.env, AISLOP_NO_TELEMETRY: "1", AISLOP_NO_UPDATE_NOTIFIER: "1", CI: "1" },
		},
	);
	expect(result.error).toBeUndefined();
	const parsed: { diagnostics: { rule: string }[] } = JSON.parse(result.stdout);
	return parsed.diagnostics.map((diagnostic) => diagnostic.rule);
};

describe("CLI rule overrides", () => {
	it("disables one rule without suppressing unrelated findings or requiring config", () => {
		expect(run([])).toEqual(
			expect.arrayContaining(["ai-slop/python-print-debug", "ai-slop/python-bare-except"]),
		);
		const rules = run(["--ignore", "ai-slop/python-print-debug"]);
		expect(rules).not.toContain("ai-slop/python-print-debug");
		expect(rules).toContain("ai-slop/python-bare-except");
		expect(fs.existsSync(path.join(root, ".aislop", "config.yml"))).toBe(false);
	});

	it.each([true, false])(
		"accepts repeated and comma-separated IDs on explicit scan=%s",
		(command) => {
			const rules = run(
				[
					"--ignore",
					"ai-slop/python-print-debug,ai-slop/python-bare-except",
					"--ignore",
					"ai-slop/narrative-comment",
				],
				command,
			);
			expect(rules).not.toContain("ai-slop/python-print-debug");
			expect(rules).not.toContain("ai-slop/python-bare-except");
		},
	);

	it("takes precedence over per-file severity overrides without rewriting config", () => {
		fs.mkdirSync(path.join(root, ".aislop"));
		const config =
			"overrides:\n  - files: ['**/*.py']\n    rules:\n      ai-slop/python-print-debug: error\n";
		fs.writeFileSync(path.join(root, ".aislop", "config.yml"), config);
		expect(run(["--ignore", "ai-slop/python-print-debug"])).not.toContain(
			"ai-slop/python-print-debug",
		);
		expect(fs.readFileSync(path.join(root, ".aislop", "config.yml"), "utf8")).toBe(config);
	});
});
