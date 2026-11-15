import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runJavaFormat } from "../../src/engines/format/java-format.js";
import { runCheckstyle, runPmd } from "../../src/engines/lint/java.js";
import type { EngineContext } from "../../src/engines/types.js";
import * as subprocess from "../../src/utils/subprocess.js";

let root: string;
let context: EngineContext;
beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-failure-"));
	fs.writeFileSync(path.join(root, "pom.xml"), "<googleJavaFormat/>");
	fs.writeFileSync(path.join(root, "checkstyle.xml"), '<module name="Checker"/>');
	fs.writeFileSync(path.join(root, "-Source.java"), "class Source {}");
	context = {
		rootDirectory: root, languages: ["java"], frameworks: [], files: ["-Source.java"], installedTools: {},
		config: { quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 }, security: { audit: false, auditTimeout: 0 } },
	};
});
afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(root, { recursive: true, force: true });
});

describe("Java tool failures", () => {
	it.each([
		["formatter", runJavaFormat, 1, ""],
		["PMD", runPmd, 2, ""],
		["PMD malformed report", runPmd, 0, "not JSON"],
		["Checkstyle", runCheckstyle, 2, ""],
	] as const)("reports %s failure instead of zero findings", async (_name, run, exitCode, stdout) => {
		vi.spyOn(subprocess, "runSubprocess").mockResolvedValue({ stdout, stderr: "Invalid project configuration", exitCode });
		expect(await run(context)).toEqual([expect.objectContaining({ severity: "error", fixable: false })]);
	});

	it.each([runJavaFormat, runPmd, runCheckstyle])("reports process failures", async (run) => {
		vi.spyOn(subprocess, "runSubprocess").mockRejectedValue(new Error("Tool timed out"));
		expect(await run(context)).toEqual([expect.objectContaining({ severity: "error", message: expect.stringContaining("Tool timed out") })]);
	});

	it("accepts PMD's violations exit code", async () => {
		vi.spyOn(subprocess, "runSubprocess").mockResolvedValue({
			exitCode: 4, stderr: "", stdout: JSON.stringify({ files: [{ filename: "-Source.java", violations: [{ beginline: 1, begincolumn: 1, rule: "UnusedPrivateField", ruleset: "Best Practices", priority: 3, description: "Unused field" }] }] }),
		});
		expect(await runPmd(context)).toEqual([expect.objectContaining({ rule: "pmd/UnusedPrivateField", severity: "warning" })]);
	});

	it.each([runJavaFormat, runCheckstyle])("passes dash-prefixed source names as absolute paths", async (run) => {
		const invoke = vi.spyOn(subprocess, "runSubprocess").mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
		await run(context);
		expect(invoke.mock.calls[0][1].at(-1)).toBe(path.join(root, "-Source.java"));
	});
});
