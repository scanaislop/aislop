import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../src/config/index.js";
import { JvmSecuritySchema, parseConfig } from "../src/config/schema.js";
import { runJvmSecurity } from "../src/engines/security/jvm.js";
import { detectJvmBytecode, jvmClasspath, jvmInput } from "../src/engines/security/jvm-paths.js";
import {
	parseJvmDependencyReport,
	parseSpotbugsReport,
} from "../src/engines/security/jvm-reports.js";
import { runJvmDependencyCheck, runJvmSpotbugs } from "../src/engines/security/jvm-tools.js";
import type { EngineContext } from "../src/engines/types.js";
import { isDependencyAuditInputFile } from "../src/utils/source-file-selection.js";
import * as subprocess from "../src/utils/subprocess.js";
import * as tooling from "../src/utils/tooling.js";

let root: string;
let context: EngineContext;
const sarif = JSON.parse(
	fs.readFileSync(new URL("./fixtures/jvm/spotbugs.sarif", import.meta.url), "utf8"),
);
const dependencyReport = {
	dependencies: [
		{
			fileName: "log4j-core-2.14.1.jar",
			vulnerabilities: [{ name: "CVE-2021-44228", severity: "CRITICAL" }],
		},
	],
};

const write = (name: string, value: string): string => {
	const file = path.join(root, name);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, value);
	return file;
};

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop JVM test "));
	write("pom.xml", "<project/>");
	write("src/main/java/Unsafe.java", "public class Unsafe {}");
	context = {
		rootDirectory: root,
		dependencyAuditScope: "full",
		languages: ["java"],
		frameworks: [],
		files: ["src/main/java/Unsafe.java"],
		installedTools: {},
		config: {
			quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
			security: { audit: true, auditTimeout: 25000 },
			lint: { typecheck: false, expoDoctor: false },
		},
	};
});
afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(root, { recursive: true, force: true });
});

describe("JVM report imports", () => {
	it("maps real SpotBugs and find-sec-bugs results to project source", () => {
		const diagnostics = parseSpotbugsReport(sarif, context);
		expect(
			diagnostics.map(({ filePath, line, rule, severity }) => ({ filePath, line, rule, severity })),
		).toEqual([
			{
				filePath: "src/main/java/Unsafe.java",
				line: 3,
				rule: "spotbugs/NP_ALWAYS_NULL",
				severity: "error",
			},
			{
				filePath: "src/main/java/Unsafe.java",
				line: 5,
				rule: "spotbugs/WEAK_MESSAGE_DIGEST_MD5",
				severity: "warning",
			},
		]);
	});
	it("maps Scala sources and file URLs with spaces", () => {
		const report = structuredClone(sarif);
		write("src/main/scala/Unsafe Scala.scala", "object UnsafeScala");
		context.files = ["src/main/scala/Unsafe Scala.scala"];
		report.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri =
			"Unsafe%20Scala.scala";
		expect(parseSpotbugsReport(report, context)[0].filePath).toBe(
			"src/main/scala/Unsafe Scala.scala",
		);
	});
	it("does not invent a source when filenames are ambiguous", () => {
		context.files = ["module-a/Unsafe.java", "module-b/Unsafe.java"];
		expect(parseSpotbugsReport(sarif, context)[0].filePath).toBe("pom.xml");
	});
	it("maps canonical file URLs without probing report paths outside the project", () => {
		const report = structuredClone(sarif);
		const source = fs.realpathSync(path.join(root, "src/main/java/Unsafe.java"));
		report.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri =
			pathToFileURL(source).href;
		expect(parseSpotbugsReport(report, context)[0].filePath).toBe("src/main/java/Unsafe.java");
		const outside = path.join(os.tmpdir(), "untrusted-share", "Unsafe.java");
		report.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri =
			pathToFileURL(outside).href;
		const exists = vi.spyOn(fs, "existsSync");
		expect(parseSpotbugsReport(report, context)[0]).toMatchObject({ filePath: "pom.xml", line: 0 });
		expect(exists.mock.calls.some(([file]) => String(file) === outside)).toBe(false);
	});
	it("keeps suppressed and non-applicable SARIF results out of the score", () => {
		const report = structuredClone(sarif);
		report.runs[0].results[0].suppressions = [{ status: "accepted" }];
		report.runs[0].results[1].kind = "notApplicable";
		expect(parseSpotbugsReport(report, context)).toEqual([]);
	});
	it("reports incomplete SpotBugs analysis alongside findings", () => {
		const report = structuredClone(sarif);
		report.runs[0].invocations[0].executionSuccessful = false;
		expect(parseSpotbugsReport(report, context)).toHaveLength(3);
	});
	it.each([{}, { runs: [] }, { runs: [{ tool: { driver: { name: "other" } }, results: [] }] }])(
		"rejects unsupported or malformed SARIF",
		(report) => {
			expect(() => parseSpotbugsReport(report, context)).toThrow();
		},
	);
	it("deduplicates dependency findings and anchors generated JAR paths to the build manifest", () => {
		const report = {
			dependencies: [...dependencyReport.dependencies, ...dependencyReport.dependencies],
		};
		expect(parseJvmDependencyReport(report, context)).toEqual([
			expect.objectContaining({
				filePath: "pom.xml",
				severity: "error",
				rule: "security/vulnerable-dependency",
			}),
		]);
	});
	it("uses Scala build metadata and CVSS severity for transitive JAR findings", () => {
		fs.unlinkSync(path.join(root, "pom.xml"));
		write("build.sbt", 'scalaVersion := "3.3.7"');
		context.languages = ["scala"];
		const report = {
			dependencies: [
				{
					fileName: "transitive.jar",
					vulnerabilities: [{ name: "CVE-2020-0001", cvssv3: { baseScore: 9.8 } }],
				},
			],
		};
		expect(parseJvmDependencyReport(report, context)[0]).toMatchObject({
			filePath: "build.sbt",
			severity: "error",
		});
	});
	it("reports Dependency-Check analysis exceptions", () => {
		expect(
			parseJvmDependencyReport(
				{ dependencies: [], scanInfo: { analysisExceptions: [{}] } },
				context,
			),
		).toMatchObject([{ rule: "security/jvm-analysis-failed" }]);
	});
	it("keeps the analyzer severity when older CVSS versions disagree", () => {
		const report = {
			dependencies: [
				{
					fileName: "dependency.jar",
					vulnerabilities: [
						{
							name: "CVE-2020-0002",
							severity: "MEDIUM",
							cvssv3: { baseScore: 9.8 },
							cvssv4: { baseScore: 6.1 },
						},
					],
				},
			],
		};
		expect(parseJvmDependencyReport(report, context)[0].severity).toBe("warning");
	});
	it("imports reports without executing tools and respects audit:false", async () => {
		write("reports/spotbugs.sarif", JSON.stringify(sarif));
		write("reports/dependencies.json", JSON.stringify(dependencyReport));
		const run = vi.spyOn(subprocess, "runSubprocess");
		context.config.security.jvm = JvmSecuritySchema.parse({
			spotbugsReports: ["reports/spotbugs.sarif"],
			dependencyCheckReports: ["reports/dependencies.json"],
		});
		expect(await runJvmSecurity(context)).toHaveLength(3);
		context.config.security.audit = false;
		expect(await runJvmSecurity(context)).toHaveLength(2);
		expect(run).not.toHaveBeenCalled();
	});
	it("reports invalid JSON and missing files rather than returning a clean scan", async () => {
		write("bad.json", "not JSON");
		context.config.security.jvm = JvmSecuritySchema.parse({
			spotbugsReports: ["bad.json", "missing.sarif"],
		});
		expect(await runJvmSecurity(context)).toMatchObject([
			{ severity: "error" },
			{ severity: "error" },
		]);
	});
	it("filters source findings and dependency audits in incremental scans", async () => {
		write("report.sarif", JSON.stringify(sarif));
		write("dep.json", JSON.stringify(dependencyReport));
		context.config.security.jvm = JvmSecuritySchema.parse({
			spotbugsReports: ["report.sarif"],
			dependencyCheckReports: ["dep.json"],
		});
		context.dependencyAuditScope = "files";
		context.files = ["src/Other.java"];
		context.dependencyAuditFiles = [];
		expect(await runJvmSecurity(context)).toEqual([]);
		context.candidateFiles = ["dep.json"];
		expect(await runJvmSecurity(context)).toHaveLength(1);
	});
});

describe("JVM live execution", () => {
	it("expands dependency directories into a deduplicated runtime classpath", () => {
		const jar = write("runtime libs/nested/scala-library.jar", "fixture");
		expect(jvmClasspath(root, ["runtime libs", "runtime libs/nested/scala-library.jar"])).toEqual([
			path.join(root, "runtime libs"),
			jar,
		]);
	});
	it("surfaces unexpected filesystem failures instead of dropping the security task", async () => {
		context.config.security.jvm = JvmSecuritySchema.parse({ spotbugs: true });
		context.config.allowJvmExecution = true;
		vi.spyOn(fs, "mkdtempSync").mockImplementationOnce(() => {
			throw new Error("temporary storage unavailable");
		});
		expect(await runJvmSecurity(context)).toMatchObject([
			{
				rule: "security/jvm-analysis-failed",
				severity: "error",
				message: expect.stringContaining("temporary storage unavailable"),
			},
		]);
	});
	it("rejects control characters before writing analyzer argument files", () => {
		expect(() => jvmInput(root, "unsafe\nartifact.jar")).toThrow("newline");
	});
	it("requires command-line consent even if repository configuration enables tools", async () => {
		const run = vi.spyOn(subprocess, "runSubprocess");
		const config = JvmSecuritySchema.parse({ spotbugs: true, dependencyCheck: true });
		expect(await runJvmSpotbugs(context, config)).toMatchObject([
			{ severity: "error", message: expect.stringContaining("--jvm-security") },
		]);
		expect(await runJvmDependencyCheck(context, config)).toMatchObject([
			{ severity: "error", message: expect.stringContaining("--jvm-security") },
		]);
		expect(run).not.toHaveBeenCalled();
	});
	it("accepts the SpotBugs finding exit code and passes absolute paths with spaces", async () => {
		write("target/classes/Unsafe.class", "fixture");
		context.config.allowJvmExecution = true;
		vi.spyOn(tooling, "resolveJavaToolInvocation").mockReturnValue({
			command: "java",
			args: ["-jar", "spotbugs.jar"],
		});
		const run = vi.spyOn(subprocess, "runSubprocess").mockImplementation(async (_command, args) => {
			expect(fs.readFileSync(args[args.indexOf("-analyzeFromFile") + 1], "utf8")).toBe(
				path.join(root, "target/classes"),
			);
			fs.writeFileSync(args[args.indexOf("-output") + 1], JSON.stringify(sarif));
			return { stdout: "", stderr: "", exitCode: 1 };
		});
		expect(
			await runJvmSpotbugs(context, JvmSecuritySchema.parse({ findSecBugs: false })),
		).toHaveLength(2);
		expect(run.mock.calls[0][1]).toContain("-analyzeFromFile");
	});
	it("reports missing classes and tool errors even when a report exists", async () => {
		write("target/classes/Unsafe.class", "fixture");
		context.config.allowJvmExecution = true;
		vi.spyOn(subprocess, "runSubprocess").mockImplementation(async (_command, args) => {
			fs.writeFileSync(args[args.indexOf("-output") + 1], JSON.stringify(sarif));
			return { stdout: "", stderr: "missing classes", exitCode: 3 };
		});
		expect(
			await runJvmSpotbugs(context, JvmSecuritySchema.parse({ findSecBugs: false })),
		).toHaveLength(3);
	});
	it("defaults Dependency-Check to an existing cache and reports database failures", async () => {
		write("lib/dependency.jar", "fixture");
		context.config.allowJvmExecution = true;
		const run = vi
			.spyOn(subprocess, "runSubprocess")
			.mockResolvedValue({ stdout: "", stderr: "No cached NVD data", exitCode: 13 });
		expect(
			await runJvmDependencyCheck(context, JvmSecuritySchema.parse({ dependencies: ["lib"] })),
		).toMatchObject([{ severity: "error", message: expect.stringContaining("NVD") }]);
		expect(run.mock.calls[0][1]).toContain("--noupdate");
	});
	it("updates advisory feeds only when explicitly configured and reads the generated report", async () => {
		write("lib/dependency.jar", "fixture");
		context.config.allowJvmExecution = true;
		const run = vi.spyOn(subprocess, "runSubprocess").mockImplementation(async (_command, args) => {
			fs.writeFileSync(
				path.join(args[args.indexOf("--out") + 1], "dependency-check-report.json"),
				JSON.stringify(dependencyReport),
			);
			return { stdout: "", stderr: "", exitCode: 0 };
		});
		const diagnostics = await runJvmDependencyCheck(
			context,
			JvmSecuritySchema.parse({ dependencies: ["lib"], updateData: true }),
		);
		expect(diagnostics).toHaveLength(1);
		expect(run.mock.calls[0][1]).toContain("--nvdDatafeed");
		expect(run.mock.calls[0][1]).not.toContain("--noupdate");
	});
	it("discovers Maven, Gradle and versioned sbt compiled class directories", () => {
		for (const file of [
			"target/classes/A.class",
			"build/classes/java/main/A.class",
			"build/classes/scala/main/A.class",
			"target/scala-3.3.7/classes/A.class",
		])
			write(file, "fixture");
		expect(detectJvmBytecode(root)).toHaveLength(4);
	});
	it("rejects symlinked default artifact roots before discovering classes", () => {
		fs.symlinkSync(
			os.tmpdir(),
			path.join(root, "target"),
			process.platform === "win32" ? "junction" : "dir",
		);
		expect(() => detectJvmBytecode(root)).toThrow("symlinks");
	});
	it("fails live audits when no dependency artifacts were analyzed", async () => {
		fs.mkdirSync(path.join(root, "lib"));
		context.config.allowJvmExecution = true;
		vi.spyOn(subprocess, "runSubprocess").mockImplementation(async (_command, args) => {
			fs.writeFileSync(
				path.join(args[args.indexOf("--out") + 1], "dependency-check-report.json"),
				JSON.stringify({ dependencies: [] }),
			);
			return { stdout: "", stderr: "", exitCode: 0 };
		});
		expect(
			await runJvmDependencyCheck(context, JvmSecuritySchema.parse({ dependencies: ["lib"] })),
		).toMatchObject([
			{ severity: "error", message: expect.stringContaining("No dependency artifacts") },
		]);
	});
	it("rejects paths and symlinks outside the project", () => {
		expect(() => jvmInput(root, "..")).toThrow("inside the project");
		fs.symlinkSync(
			os.tmpdir(),
			path.join(root, "outside"),
			process.platform === "win32" ? "junction" : "dir",
		);
		expect(() => jvmInput(root, "outside")).toThrow("inside the project");
	});
	it("rejects nested symlinks before handing directory trees to external tools", () => {
		fs.mkdirSync(path.join(root, "artifacts"));
		fs.symlinkSync(
			os.tmpdir(),
			path.join(root, "artifacts/link"),
			process.platform === "win32" ? "junction" : "dir",
		);
		expect(() => jvmInput(root, "artifacts")).toThrow("symlinks");
	});
});

describe("JVM configuration and scope", () => {
	it("keeps optional tools disabled by default", () => {
		expect(parseConfig({}).security.jvm).toBeUndefined();
		expect(JvmSecuritySchema.parse({})).toMatchObject({
			spotbugs: false,
			dependencyCheck: false,
			updateData: false,
		});
	});
	it.each([{ spotbugs: "yes" }, { timeout: -1 }, { dependencyChek: true }])(
		"rejects invalid JVM options instead of falling back",
		(jvm) => {
			expect(() => parseConfig({ security: { jvm } })).toThrow("Invalid security.jvm");
		},
	);
	it("does not hide invalid JVM configuration in the config loader", () => {
		write(".aislop/config.yml", "security:\n  jvm:\n    spotbugs: yes\n");
		expect(() => loadConfig(root)).toThrow("Invalid security.jvm");
	});
	it.each([
		"pom.xml",
		"module/build.gradle.kts",
		"build.sbt",
		"project/Dependencies.scala",
		"libs/transitive.jar",
		"gradle.lockfile",
	])("recognizes dependency audit input %s", (file) => {
		expect(isDependencyAuditInputFile(file)).toBe(true);
	});
});
