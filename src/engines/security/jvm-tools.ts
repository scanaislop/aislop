import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { JvmSecurityConfig } from "../../config/schema.js";
import { runSubprocess } from "../../utils/subprocess.js";
import { resolveFindSecBugsPlugin, resolveJavaToolInvocation } from "../../utils/tooling.js";
import type { Diagnostic, EngineContext } from "../types.js";
import {
	detectJvmBytecode,
	jvmClasspath,
	jvmFailure,
	jvmInput,
	readJvmReport,
} from "./jvm-paths.js";
import { parseJvmDependencyReport, parseSpotbugsReport } from "./jvm-reports.js";

export const runJvmSpotbugs = async (
	context: EngineContext,
	config: JvmSecurityConfig,
): Promise<Diagnostic[]> => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-spotbugs-"));
	try {
		if (!context.config.allowJvmExecution)
			throw new Error("Live JVM analysis requires the explicit --jvm-security flag");
		const inputs = config.bytecode.length
			? config.bytecode
			: detectJvmBytecode(context.rootDirectory);
		if (!inputs.length)
			throw new Error(
				"No compiled classes found. Build the trusted project first or configure security.jvm.bytecode.",
			);
		const report = path.join(directory, "spotbugs.sarif");
		const args = ["-textui", "-sarif", "-exitcode", "-output", report];
		if (config.findSecBugs) {
			const plugin = config.findSecBugsPlugin
				? jvmInput(context.rootDirectory, config.findSecBugsPlugin)
				: resolveFindSecBugsPlugin();
			if (!plugin)
				throw new Error(
					"find-sec-bugs is unavailable. Run aislop-tools --jvm-security or configure findSecBugsPlugin.",
				);
			args.push("-pluginList", plugin);
		}
		const classpath = jvmClasspath(context.rootDirectory, [
			...config.classpath,
			...config.dependencies,
		]);
		if (classpath.length) {
			const classpathFile = path.join(directory, "classpath.txt");
			fs.writeFileSync(classpathFile, classpath.join("\n"));
			args.push("-auxclasspathFromFile", classpathFile);
		}
		const targetsFile = path.join(directory, "targets.txt");
		fs.writeFileSync(
			targetsFile,
			inputs.map((file) => jvmInput(context.rootDirectory, file)).join("\n"),
		);
		args.push("-analyzeFromFile", targetsFile);
		const tool = resolveJavaToolInvocation("spotbugs");
		const result = await runSubprocess(tool.command, [...tool.args, ...args], {
			cwd: context.rootDirectory,
			timeout: config.timeout,
		});
		const diagnostics = parseSpotbugsReport(readJvmReport(report), context);
		if (
			result.exitCode !== 0 &&
			result.exitCode !== 1 &&
			!diagnostics.some((item) => item.rule === "security/jvm-analysis-failed")
		)
			diagnostics.push(
				jvmFailure(
					"SpotBugs",
					result.stderr || `exit code ${result.exitCode} (analysis errors or missing classes)`,
					context.rootDirectory,
				),
			);
		return diagnostics;
	} catch (error) {
		return [jvmFailure("SpotBugs", error, context.rootDirectory)];
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
};

export const runJvmDependencyCheck = async (
	context: EngineContext,
	config: JvmSecurityConfig,
): Promise<Diagnostic[]> => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-dependency-check-"));
	try {
		if (!context.config.allowJvmExecution)
			throw new Error("Live JVM analysis requires the explicit --jvm-security flag");
		if (!config.dependencies.length)
			throw new Error(
				"Configure security.jvm.dependencies with resolved dependency JARs/directories. Build and resolve dependencies in the trusted project first.",
			);
		const args = [
			"--format",
			"JSON",
			"--out",
			directory,
			"--project",
			"aislop-jvm",
			"--disableVersionCheck",
			"--disableNodeAudit",
			"--disableYarnAudit",
			"--disablePnpmAudit",
			"--disableBundleAudit",
			"--disableMSBuild",
		];
		if (!config.updateData) args.push("--noupdate");
		else
			args.push("--nvdDatafeed", "https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-{0}.json.gz");
		if (config.dataDirectory)
			args.push("--data", path.resolve(context.rootDirectory, config.dataDirectory));
		for (const file of config.dependencies)
			args.push("--scan", jvmInput(context.rootDirectory, file));
		const tool = resolveJavaToolInvocation("dependency-check");
		const result = await runSubprocess(tool.command, [...tool.args, ...args], {
			cwd: context.rootDirectory,
			timeout: config.timeout,
		});
		if (result.exitCode !== 0)
			throw new Error(result.stderr || `Dependency-Check exited with ${result.exitCode}`);
		const report = readJvmReport(path.join(directory, "dependency-check-report.json"));
		const diagnostics = parseJvmDependencyReport(report, context);
		if (
			typeof report === "object" &&
			report !== null &&
			"dependencies" in report &&
			Array.isArray(report.dependencies) &&
			report.dependencies.length === 0
		)
			throw new Error(
				"No dependency artifacts were analyzed. Check dependency paths or disable the optional audit for projects without external dependencies.",
			);
		return diagnostics;
	} catch (error) {
		return [jvmFailure("Dependency-Check", error, context.rootDirectory)];
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
};
