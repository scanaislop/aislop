import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildBaseline } from "../src/baseline/match.js";

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
		[cli, ...command.split(" "), root, ...(command === "scan" ? ["--json"] : []), ...extra],
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
	it.each(["scan", "ci"])("honors include-only source scope in %s", (command) => {
		for (const file of ["src/keep/Safe.java", "src/omit/Unsafe.java"]) {
			fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
			fs.writeFileSync(path.join(root, file), "class Safe {}");
		}
		fs.writeFileSync(
			path.join(root, ".aislop/config.yml"),
			`${engineConfig}security:\n  audit: false\n  jvm:\n    spotbugsReports: [spotbugs.sarif]\n`,
		);
		fs.writeFileSync(
			path.join(root, "spotbugs.sarif"),
			JSON.stringify({
				runs: [
					{
						tool: { driver: { name: "SpotBugs" } },
						results: ["src/omit/Unsafe.java", "Unsafe.java"].map((uri) => ({
							ruleId: "NP_ALWAYS_NULL",
							level: "error",
							message: { text: "Omitted source finding" },
							locations: [{ physicalLocation: { artifactLocation: { uri } } }],
						})),
					},
				],
			}),
		);
		const result = invoke(command, ["--include", "src/keep/**"]);
		expect(result.status, result.stderr).toBe(0);
		expect(JSON.parse(result.stdout).diagnostics).toEqual([]);
	});
	it.each(["missing.sarif", "malformed.sarif"])(
		"refuses baseline creation and acceptance for failed report %s",
		(reportFile) => {
			fs.writeFileSync(path.join(root, "Safe.java"), "class Safe {}");
			if (reportFile === "malformed.sarif")
				fs.writeFileSync(path.join(root, reportFile), "not JSON");
			fs.writeFileSync(
				path.join(root, ".aislop/config.yml"),
				`${engineConfig}ci:\n  baseline: .aislop/ci-baseline.json\nsecurity:\n  audit: false\n  jvm:\n    spotbugsReports: [${reportFile}]\n`,
			);
			const write = invoke("baseline write");
			expect(write.status, write.stderr).toBe(1);
			const baseline = path.join(root, ".aislop/ci-baseline.json");
			expect(fs.existsSync(baseline)).toBe(false);
			const first = invoke("ci");
			const findings = JSON.parse(first.stdout).diagnostics;
			expect(findings).toEqual([expect.objectContaining({ rule: "security/jvm-analysis-failed" })]);
			fs.writeFileSync(baseline, JSON.stringify(buildBaseline(findings, root)));
			const second = invoke("ci");
			expect(second.status, second.stderr).toBe(1);
			expect(JSON.parse(second.stdout).baseline).toMatchObject({ accepted: 0, new: 1 });
		},
	);
	it("honors excluded JVM source paths without reattaching findings to the manifest", () => {
		for (const file of [
			"Safe.java",
			"src/generated/Generated.java",
			"src/external-code/Excluded.java",
		]) {
			fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
			fs.writeFileSync(path.join(root, file), "class Safe {}");
		}
		fs.writeFileSync(
			path.join(root, ".aislop/config.yml"),
			`${engineConfig}exclude: [src/generated, src/external-code]\nsecurity:\n  audit: false\n  jvm:\n    spotbugsReports: [spotbugs.sarif]\n`,
		);
		fs.writeFileSync(
			path.join(root, "spotbugs.sarif"),
			JSON.stringify({
				runs: [
					{
						tool: { driver: { name: "SpotBugs" } },
						results: ["src/generated/Generated.java", "Excluded.java"].map((uri) => ({
							ruleId: "NP_ALWAYS_NULL",
							level: "error",
							message: { text: "Excluded source finding" },
							locations: [{ physicalLocation: { artifactLocation: { uri } } }],
						})),
					},
				],
			}),
		);
		const result = invoke("ci");
		expect(result.status, result.stderr).toBe(0);
		expect(JSON.parse(result.stdout).diagnostics).toEqual([]);
	});
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
