import { z } from "zod/v4";
import type { Diagnostic, EngineContext } from "../types.js";
import { jvmFailure, jvmManifest, jvmSource } from "./jvm-paths.js";

const SarifResult = z.object({
	ruleId: z.string().min(1),
	level: z.string().optional(),
	kind: z.string().optional(),
	message: z.object({ text: z.string().optional(), markdown: z.string().optional() }),
	suppressions: z.array(z.object({ status: z.string().optional() })).optional(),
	locations: z
		.array(
			z.object({
				physicalLocation: z
					.object({
						artifactLocation: z.object({ uri: z.string().optional() }).optional(),
						region: z
							.object({
								startLine: z.number().int().nonnegative().optional(),
								startColumn: z.number().int().nonnegative().optional(),
							})
							.optional(),
					})
					.optional(),
			}),
		)
		.optional(),
});
const SpotbugsReport = z.object({
	runs: z
		.array(
			z.object({
				tool: z.object({ driver: z.object({ name: z.string() }) }),
				results: z.array(SarifResult),
				invocations: z.array(z.object({ executionSuccessful: z.boolean().optional() })).optional(),
			}),
		)
		.min(1),
});

export const parseSpotbugsReport = (report: unknown, context: EngineContext): Diagnostic[] => {
	const parsed = SpotbugsReport.parse(report);
	return parsed.runs.flatMap((run): Diagnostic[] => {
		if (!/spotbugs/i.test(run.tool.driver.name))
			throw new Error("Expected a SpotBugs SARIF report");
		const diagnostics = run.results.flatMap((result): Diagnostic[] => {
			if (
				["pass", "notApplicable"].includes(result.kind ?? "") ||
				result.level === "none" ||
				result.suppressions?.some((entry) => entry.status === "accepted")
			)
				return [];
			const physical = result.locations?.[0]?.physicalLocation;
			const message = result.message.text ?? result.message.markdown;
			if (!message) throw new Error("SpotBugs result has no message");
			const filePath = jvmSource(physical?.artifactLocation?.uri, context);
			const mapped = filePath !== jvmManifest(context.rootDirectory);
			return [
				{
					filePath,
					engine: "security",
					rule: `spotbugs/${result.ruleId}`,
					severity:
						result.level === "error" ? "error" : result.level === "note" ? "info" : "warning",
					message,
					help: "Review the compiled-code finding and its source. Rebuild before rerunning SpotBugs.",
					line: mapped ? (physical?.region?.startLine ?? 0) : 0,
					column: mapped ? (physical?.region?.startColumn ?? 0) : 0,
					category: "JVM Security",
					fixable: false,
				},
			];
		});
		if (run.invocations?.some((invocation) => invocation.executionSuccessful === false))
			diagnostics.push(
				jvmFailure("SpotBugs", "report indicates incomplete analysis", context.rootDirectory),
			);
		return diagnostics;
	});
};

const Vulnerability = z.object({
	name: z.string().min(1),
	severity: z.string().optional(),
	description: z.string().optional(),
	cvssv3: z.object({ baseScore: z.number().optional() }).optional(),
	cvssv4: z.object({ baseScore: z.number().optional() }).optional(),
	cvssv2: z.object({ score: z.number().optional() }).optional(),
});
const DependencyReport = z.object({
	dependencies: z.array(
		z.object({ fileName: z.string().min(1), vulnerabilities: z.array(Vulnerability).optional() }),
	),
	scanInfo: z.object({ analysisExceptions: z.array(z.unknown()).optional() }).optional(),
});

export const parseJvmDependencyReport = (report: unknown, context: EngineContext): Diagnostic[] => {
	const parsed = DependencyReport.parse(report);
	const seen = new Set<string>();
	const diagnostics = parsed.dependencies.flatMap((dependency): Diagnostic[] =>
		(dependency.vulnerabilities ?? []).flatMap((vulnerability): Diagnostic[] => {
			const key = `${dependency.fileName}\0${vulnerability.name}`;
			if (seen.has(key)) return [];
			seen.add(key);
			const severity = (vulnerability.severity ?? "unknown").toLowerCase();
			const score =
				vulnerability.cvssv4?.baseScore ??
				vulnerability.cvssv3?.baseScore ??
				vulnerability.cvssv2?.score ??
				0;
			const classified = ["critical", "high", "medium", "moderate", "low"].includes(severity);
			return [
				{
					filePath: jvmManifest(context.rootDirectory),
					engine: "security",
					rule: "security/vulnerable-dependency",
					severity:
						["critical", "high"].includes(severity) || (!classified && score >= 7)
							? "error"
							: "warning",
					message: `${vulnerability.name} in JVM dependency ${dependency.fileName} (${severity})`,
					help: `Upgrade or remove the resolved dependency. ${vulnerability.description?.slice(0, 512) ?? "Review the advisory and dependency graph."}`,
					line: 0,
					column: 0,
					category: "JVM Dependencies",
					fixable: false,
				},
			];
		}),
	);
	if (parsed.scanInfo?.analysisExceptions?.length)
		diagnostics.push(
			jvmFailure("Dependency-Check", "report contains analysis exceptions", context.rootDirectory),
		);
	return diagnostics;
};
