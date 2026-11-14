import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fixScalaFormat, runScalaFormat } from "../../src/engines/format/scala-format.js";
import { getScalaTargets, hasScalafmtConfig } from "../../src/engines/scala-targets.js";
import type { EngineContext } from "../../src/engines/types.js";
import * as subprocess from "../../src/utils/subprocess.js";

let root: string;
const write = (relative: string, content: string): string => {
	const file = path.join(root, relative);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
	return file;
};
const context = (files: string[]): EngineContext => ({
	rootDirectory: root,
	languages: ["scala"],
	frameworks: [],
	files,
	installedTools: { scalafmt: true },
	config: {
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
		lint: { typecheck: false, expoDoctor: false },
	},
});
beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-scala-format-"));
});
afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(root, { recursive: true, force: true });
});

describe("Scala formatter", () => {
	it("accepts scalafmt's difference exit code and decodes file URLs", async () => {
		write(".scalafmt.conf", "version = 3.11.5\n");
		const file = write("source with spaces/Bad.scala", "object  Bad\n");
		vi.spyOn(subprocess, "runSubprocess").mockResolvedValue({
			stdout: pathToFileURL(file).href,
			stderr: "",
			exitCode: 1,
		});
		expect(await runScalaFormat(context([file]))).toEqual([
			expect.objectContaining({ filePath: "source with spaces/Bad.scala", severity: "warning", fixable: true }),
		]);
	});

	it("reports exit code 1 without file results as a failure", async () => {
		write(".scalafmt.conf", "version = 3.11.5\n");
		const file = write("Bad.scala", "object Bad\n");
		vi.spyOn(subprocess, "runSubprocess").mockResolvedValue({ stdout: "", stderr: "Formatting failed", exitCode: 1 });
		expect(await runScalaFormat(context([file]))).toEqual([
			expect.objectContaining({ severity: "error", fixable: false }),
		]);
	});

	it("requires project configuration", async () => {
		const tool = vi.spyOn(subprocess, "runSubprocess");
		const file = write("src/Bad.scala", "object   Bad\n");
		expect(hasScalafmtConfig(root)).toBe(false);
		expect(await runScalaFormat(context([file]))).toEqual([]);
		expect(tool).not.toHaveBeenCalled();
	});

	it("reports both relative and absolute formatter paths without changing source", async () => {
		write(".scalafmt.conf", "version = 3.8.3\n");
		const source = "object   Bad\n";
		const file = write("src/Bad.scala", source);
		const tool = vi
			.spyOn(subprocess, "runSubprocess")
			.mockResolvedValue({ stdout: file, stderr: "", exitCode: 0 });
		const findings = await runScalaFormat(context([file]));
		expect(findings.map((d) => `${d.rule}:${d.filePath}`)).toEqual([
			"scala-formatting:src/Bad.scala",
		]);
		expect(tool).toHaveBeenCalledWith(
			"scalafmt",
			["--non-interactive", "--list", file],
			expect.objectContaining({ cwd: root }),
		);
		expect(fs.readFileSync(file, "utf8")).toBe(source);
	});

	it("reports a tool failure instead of an empty successful check", async () => {
		write(".scalafmt.conf", "version = 3.8.3\n");
		const file = write("src/Bad.scala", "object Bad\n");
		vi.spyOn(subprocess, "runSubprocess").mockResolvedValue({
			stdout: "",
			stderr: "Invalid config",
			exitCode: 2,
		});
		const findings = await runScalaFormat(context([file]));
		expect(findings).toEqual([
			expect.objectContaining({
				severity: "error",
				fixable: false,
				message: "scalafmt failed: Invalid config",
			}),
		]);
	});

	it("invokes fixes only on selected targets with absolute file arguments", async () => {
		write(".scalafmt.conf", "version = 3.8.3\n");
		const file = write("-Bad.scala", "object Bad\n");
		const tool = vi
			.spyOn(subprocess, "runSubprocess")
			.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
		await fixScalaFormat(context([file]));
		expect(tool).toHaveBeenCalledWith(
			"scalafmt",
			["--non-interactive", file],
			expect.objectContaining({ cwd: root }),
		);
	});

	it("rejects outside-project targets and keeps Scala scripts", () => {
		expect(
			getScalaTargets(context(["src/Main.scala", "run.sc", "../outside.scala", "src/Other.java"])),
		).toEqual(["src/Main.scala", "run.sc"]);
	});
});
