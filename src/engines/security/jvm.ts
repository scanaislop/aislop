import path from "node:path";
import type { Diagnostic, EngineContext } from "../types.js";
import { shouldRunDependencyAudit } from "./audit.js";
import { jvmFailure, jvmInput, readJvmReport } from "./jvm-paths.js";
import { parseJvmDependencyReport, parseSpotbugsReport } from "./jvm-reports.js";
import { runJvmDependencyCheck, runJvmSpotbugs } from "./jvm-tools.js";

const importReports = (
	files: string[],
	parser: (report: unknown, context: EngineContext) => Diagnostic[],
	context: EngineContext,
): Diagnostic[] =>
	files.flatMap((file) => {
		try {
			return parser(readJvmReport(jvmInput(context.rootDirectory, file)), context);
		} catch (error) {
			return [jvmFailure(`Report ${file}`, error, context.rootDirectory)];
		}
	});

const selectedReport = (context: EngineContext, reports: string[]): boolean => {
	const selected = [...(context.dependencyAuditFiles ?? []), ...(context.candidateFiles ?? [])];
	return reports.some((report) =>
		selected.some(
			(file) =>
				path.resolve(context.rootDirectory, file) === path.resolve(context.rootDirectory, report),
		),
	);
};

const collectJvmSecurity = async (context: EngineContext): Promise<Diagnostic[]> => {
	const config = context.config.security.jvm;
	if (!config) return [];
	let diagnostics = importReports(config.spotbugsReports, parseSpotbugsReport, context);
	if (config.spotbugs) diagnostics.push(...(await runJvmSpotbugs(context, config)));
	if (
		context.dependencyAuditScope === "files" &&
		!selectedReport(context, config.spotbugsReports)
	) {
		const selected = new Set(
			(context.files ?? []).map((file) =>
				path
					.relative(context.rootDirectory, path.resolve(context.rootDirectory, file))
					.split(path.sep)
					.join("/"),
			),
		);
		diagnostics = diagnostics.filter(
			(item) => item.rule === "security/jvm-analysis-failed" || selected.has(item.filePath),
		);
	}
	if (
		context.config.security.audit &&
		(shouldRunDependencyAudit(context) || selectedReport(context, config.dependencyCheckReports))
	) {
		diagnostics.push(
			...importReports(config.dependencyCheckReports, parseJvmDependencyReport, context),
		);
		if (config.dependencyCheck) diagnostics.push(...(await runJvmDependencyCheck(context, config)));
	}
	const seen = new Set<string>();
	return diagnostics.filter((item) => {
		const key = `${item.rule}\0${item.filePath}\0${item.line}\0${item.message}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

export const runJvmSecurity = (context: EngineContext): Promise<Diagnostic[]> =>
	collectJvmSecurity(context).catch((error: unknown) => [
		jvmFailure("JVM security", error, context.rootDirectory),
	]);
