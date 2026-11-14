import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
let root: string;
beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop JVM CLI "));
	fs.mkdirSync(path.join(root, ".aislop"));
	fs.writeFileSync(path.join(root, "pom.xml"), "<project/>");
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const invoke = (command: string, extra: string[] = []) =>
	spawnSync(
		process.execPath,
		[cli, command, root, ...(command === "scan" ? ["--json"] : []), ...extra],
		{
			encoding: "utf8",
			timeout: 30000,
			env: {
				...process.env,
				AISLOP_NO_TELEMETRY: "1",
				AISLOP_NO_HISTORY: "1",
				AISLOP_NO_UPDATE_NOTIFIER: "1",
				DO_NOT_TRACK: "1",
			},
		},
	);
const engineConfig =
	"engines:\n  format: false\n  lint: false\n  code-quality: false\n  ai-slop: false\n  architecture: false\n";

describe("JVM CLI contracts", () => {
	it("rejects a requested JVM run without JVM configuration", () => {
		const result = invoke("scan", ["--jvm-security"]);
		expect(result.status, result.stderr).toBe(1);
		expect(JSON.parse(result.stdout).error).toContain("Configure security.jvm");
	});
	it.each(["scan", "ci"])(
		"requires execution consent for %s and forwards the explicit flag",
		(command) => {
			fs.writeFileSync(path.join(root, "Safe.java"), "public class Safe {}");
			fs.writeFileSync(
				path.join(root, ".aislop/config.yml"),
				`${engineConfig}security:\n  audit: false\n  jvm:\n    spotbugs: true\n`,
			);
			const denied = invoke(command);
			expect(denied.status, denied.stderr).toBe(1);
			expect(JSON.parse(denied.stdout).diagnostics).toEqual([
				expect.objectContaining({
					rule: "security/jvm-analysis-failed",
					message: expect.stringContaining("--jvm-security"),
				}),
			]);
			const consented = invoke(command, ["--jvm-security"]);
			expect(consented.status, consented.stderr).toBe(1);
			expect(JSON.parse(consented.stdout).diagnostics).toEqual([
				expect.objectContaining({ message: expect.stringContaining("No compiled classes") }),
			]);
		},
	);
	it("audits a manifest-only JVM project through reports and fails CI on vulnerabilities", () => {
		fs.writeFileSync(
			path.join(root, ".aislop/config.yml"),
			`${engineConfig}security:\n  jvm:\n    dependencyCheckReports: [dependency-report.json]\n`,
		);
		fs.writeFileSync(
			path.join(root, "dependency-report.json"),
			JSON.stringify({
				dependencies: [
					{
						fileName: "unsafe.jar",
						vulnerabilities: [{ name: "CVE-2021-44228", severity: "CRITICAL" }],
					},
				],
			}),
		);
		const result = invoke("ci");
		expect(result.status, result.stderr).toBe(1);
		const report = JSON.parse(result.stdout);
		expect(report.scoreable).toBe(false);
		expect(report.diagnostics).toEqual([
			expect.objectContaining({
				filePath: "pom.xml",
				rule: "security/vulnerable-dependency",
				severity: "error",
			}),
		]);
	});
});
