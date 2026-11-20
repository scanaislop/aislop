import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import { lintEngine } from "../../src/engines/lint/index.js";
import * as subprocess from "../../src/utils/subprocess.js";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-lint-report-"));
const file = path.join(root, "demo.js");
const context = {
	rootDirectory: root,
	files: [file],
	frameworks: [],
	installedTools: { "golangci-lint": true },
	config: { ...DEFAULT_CONFIG, lint: { ...DEFAULT_CONFIG.lint, typecheck: false } },
};
afterEach(() => {
	vi.restoreAllMocks();
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

it("retains Go findings when oxlint cannot return a report", async () => {
	fs.writeFileSync(file, "debugger;");
	vi.spyOn(subprocess, "runSubprocess").mockImplementation(async (command) =>
		command === process.execPath
			? { stdout: "", stderr: "unavailable", exitCode: 1 }
			: {
					stdout: JSON.stringify({
						Issues: [
							{
								FromLinter: "vet",
								Text: "finding",
								Pos: { Filename: "main.go", Line: 1, Column: 1 },
							},
						],
					}),
					stderr: "",
					exitCode: 1,
				},
	);
	const result = await lintEngine.run({ ...context, languages: ["javascript", "go"] });
	expect(result).toMatchObject({
		failed: true,
		skipped: false,
		skipReason: expect.stringContaining("oxlint"),
		diagnostics: [{ rule: "go/vet" }],
	});
});

it("reports a crashed Go linter as a failed check", async () => {
	vi.spyOn(subprocess, "runSubprocess").mockResolvedValue({
		stdout: "",
		stderr: "tool failed",
		exitCode: 3,
	});
	expect(await lintEngine.run({ ...context, languages: ["go"] })).toMatchObject({
		failed: true,
		skipped: true,
		skipReason: "golangci-lint failed (exit 3)",
	});
});

it("normalizes the findings exit code for both Go report formats", async () => {
	const run = vi
		.spyOn(subprocess, "runSubprocess")
		.mockResolvedValueOnce({ stdout: "", stderr: "unknown flag: --output.json.path", exitCode: 3 })
		.mockResolvedValueOnce({ stdout: '{"Issues":[]}', stderr: "", exitCode: 0 });
	const result = await lintEngine.run({ ...context, languages: ["go"] });
	expect(result.failed).toBeFalsy();
	expect(run).toHaveBeenCalledTimes(2);
	for (const [, args] of run.mock.calls) expect(args).toContain("--issues-exit-code=1");
});
