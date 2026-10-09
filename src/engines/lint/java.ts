import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { relativePosix } from "../../utils/paths.js";
import { runSubprocess } from "../../utils/subprocess.js";
import { getJavaTargets } from "../java-targets.js";
import type { Diagnostic, EngineContext } from "../types.js";

const PMD_RULES = [
	"bestpractices.xml/UnusedPrivateField",
	"bestpractices.xml/UnusedPrivateMethod",
	"bestpractices.xml/UnusedLocalVariable",
	"bestpractices.xml/AvoidPrintStackTrace",
	"bestpractices.xml/PreserveStackTrace",
	"errorprone.xml/UseEqualsToCompareStrings",
	"errorprone.xml/EqualsNull",
	"errorprone.xml/BrokenNullCheck",
	"errorprone.xml/MisplacedNullCheck",
	"errorprone.xml/ReturnFromFinallyBlock",
	"errorprone.xml/AvoidCatchingNPE",
	"errorprone.xml/CloseResource",
	"multithreading.xml/DoubleCheckedLocking",
	"security.xml/HardCodedCryptoKey",
	"security.xml/InsecureCryptoIv",
].map((rule) => `category/java/${rule}`);

const PROJECT_PMD_RULESETS = [
	"pmd.xml",
	"pmd-ruleset.xml",
	"ruleset.xml",
	"config/pmd/ruleset.xml",
	"config/pmd/pmd.xml",
];

const PROJECT_CHECKSTYLE_CONFIGS = [
	"checkstyle.xml",
	".checkstyle.xml",
	"config/checkstyle/checkstyle.xml",
	"config/checkstyle.xml",
];

const CHECKSTYLE_LINE_RE =
	/^\[(ERROR|WARN|INFO)\]\s+(.+?):(\d+)(?::(\d+))?:\s+(.*?)(?:\s+\[(\w+)\])?$/;

interface PmdViolation {
	beginline: number;
	begincolumn: number;
	rule: string;
	ruleset: string;
	priority: number;
	description: string;
}

interface PmdReport {
	files?: Array<{ filename: string; violations?: PmdViolation[] }>;
}

const CHECKSTYLE_BATCH_SIZE = 200;

const realRoot = (rootDirectory: string): string => {
	try {
		return fs.realpathSync(rootDirectory);
	} catch {
		return rootDirectory;
	}
};

const toProjectPath = (rootDirectory: string, filePath: string): string => {
	const absolute = path.resolve(rootDirectory, filePath);
	const direct = relativePosix(rootDirectory, absolute);
	if (!direct.startsWith("..")) return direct;
	return relativePosix(realRoot(rootDirectory), absolute);
};

const firstExisting = (rootDirectory: string, candidates: string[]): string | null => {
	for (const candidate of candidates) {
		const full = path.join(rootDirectory, candidate);
		if (fs.statSync(full, { throwIfNoEntry: false })?.isFile()) return full;
	}
	return null;
};

export const findProjectCheckstyleConfig = (rootDirectory: string): string | null =>
	firstExisting(rootDirectory, PROJECT_CHECKSTYLE_CONFIGS);

const withFileList = async <T>(
	targets: string[],
	run: (fileList: string) => Promise<T>,
): Promise<T> => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-lint-"));
	const fileList = path.join(dir, "files.txt");
	fs.writeFileSync(fileList, targets.join("\n"));
	try {
		return await run(fileList);
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
};

export const parsePmdReport = (output: string, rootDirectory: string): Diagnostic[] => {
	let report: PmdReport;
	try {
		report = JSON.parse(output) as PmdReport;
	} catch {
		return [];
	}
	return (report.files ?? []).flatMap((file) =>
		(file.violations ?? []).map((violation) => ({
			filePath: toProjectPath(rootDirectory, file.filename),
			engine: "lint" as const,
			rule: `pmd/${violation.rule}`,
			severity: violation.priority <= 2 ? ("error" as const) : ("warning" as const),
			message: violation.description,
			help: `PMD ${violation.ruleset} rule ${violation.rule}`,
			line: violation.beginline,
			column: violation.begincolumn,
			category: "Java Lint",
			fixable: false,
		})),
	);
};

export const parseCheckstyleOutput = (output: string, rootDirectory: string): Diagnostic[] =>
	output.split(/\r?\n/).flatMap((line) => {
		const match = CHECKSTYLE_LINE_RE.exec(line.trim());
		if (!match || match[1] === "INFO") return [];
		return [
			{
				filePath: toProjectPath(rootDirectory, match[2]),
				engine: "lint" as const,
				rule: `checkstyle/${match[6] ?? "Checkstyle"}`,
				severity: match[1] === "ERROR" ? ("error" as const) : ("warning" as const),
				message: match[5],
				help: "Checkstyle finding from the project's configuration",
				line: Number(match[3]),
				column: match[4] ? Number(match[4]) : 0,
				category: "Java Lint",
				fixable: false,
			},
		];
	});

export const runPmd = async (context: EngineContext): Promise<Diagnostic[]> => {
	const targets = getJavaTargets(context);
	if (targets.length === 0) return [];
	const rulesets =
		firstExisting(context.rootDirectory, PROJECT_PMD_RULESETS) ?? PMD_RULES.join(",");
	try {
		return await withFileList(targets, async (fileList) => {
			const result = await runSubprocess(
				"pmd",
				[
					"check",
					"--no-cache",
					"--no-progress",
					"-f",
					"json",
					"-R",
					rulesets,
					"--file-list",
					fileList,
				],
				{ cwd: context.rootDirectory, timeout: 180000 },
			);
			return parsePmdReport(result.stdout, context.rootDirectory);
		});
	} catch {
		return [];
	}
};

export const runCheckstyle = async (context: EngineContext): Promise<Diagnostic[]> => {
	const config = findProjectCheckstyleConfig(context.rootDirectory);
	const targets = getJavaTargets(context);
	if (!config || targets.length === 0) return [];
	const diagnostics: Diagnostic[] = [];
	for (let i = 0; i < targets.length; i += CHECKSTYLE_BATCH_SIZE) {
		const batch = targets.slice(i, i + CHECKSTYLE_BATCH_SIZE);
		try {
			const result = await runSubprocess("checkstyle", ["-c", config, ...batch], {
				cwd: context.rootDirectory,
				timeout: 180000,
			});
			diagnostics.push(...parseCheckstyleOutput(result.stdout, context.rootDirectory));
		} catch {
			continue;
		}
	}
	return diagnostics;
};
