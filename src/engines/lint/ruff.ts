import { runSubprocess } from "../../utils/subprocess.js";
import { filterConsumedFacadeImports } from "../python-facade.js";
import { getPythonTargets, getRuffDiagnosticPath, resolveRuffBinary } from "../python-targets.js";
import type { Diagnostic, EngineContext } from "../types.js";

interface RuffDiagnostic {
	code: string;
	message: string;
	filename: string;
	location: { row: number; column: number };
	fix?: { applicability: string };
}

const engineNotice = (rule: string, message: string): Diagnostic => ({
	filePath: ".",
	engine: "lint",
	rule,
	severity: rule === "ruff/engine-error" ? "error" : "warning",
	message,
	help: "",
	line: 0,
	column: 0,
	category: "Python Lint",
	fixable: false,
});

export const runRuffLint = async (
	context: EngineContext,
	ruffBinary = resolveRuffBinary(context),
): Promise<Diagnostic[]> => {
	const targets = getPythonTargets(context);
	if (targets.length === 0) return [];

	try {
		const result = await runSubprocess(
			ruffBinary,
			["check", "--output-format=json", "--force-exclude", ...targets],
			{
				cwd: context.rootDirectory,
				timeout: 60000,
			},
		);

		if (result.exitCode !== 0 && result.exitCode !== 1) {
			return [engineNotice("ruff/engine-error", result.stderr || "Python lint did not complete.")];
		}
		const warnings = result.stderr.split(/\r?\n/).flatMap((line) => {
			const marker = "Unsupported by the aislop Python engine:";
			const start = line.indexOf(marker);
			return start < 0 ? [] : [engineNotice("ruff/unsupported-rules", line.slice(start))];
		});

		const diagnostics: RuffDiagnostic[] = JSON.parse(result.stdout);
		const findings = diagnostics.map((d) => ({
			filePath: getRuffDiagnosticPath(context.rootDirectory, d.filename),
			engine: "lint" as const,
			rule: `ruff/${d.code}`,
			severity:
				d.code.startsWith("E") || d.code.startsWith("F")
					? ("error" as const)
					: ("warning" as const),
			message: d.message,
			help: "",
			line: d.location.row,
			column: d.location.column,
			category: "Python Lint",
			fixable: d.fix?.applicability === "safe",
		}));
		return [...warnings, ...filterConsumedFacadeImports(findings, context)];
	} catch (error) {
		return [
			engineNotice("ruff/engine-error", error instanceof Error ? error.message : String(error)),
		];
	}
};

const ruffLintFixArgs = (context: EngineContext, unsafe: boolean): string[] => {
	const targets = context.files ? getPythonTargets(context) : [context.rootDirectory];
	const args = ["check", "--fix", "--exit-zero", "--force-exclude"];
	if (unsafe) args.push("--unsafe-fixes");
	args.push(...targets);
	return args;
};

export const fixRuffLint = async (context: EngineContext): Promise<void> => {
	if (context.files && getPythonTargets(context).length === 0) return;
	const ruffBinary = resolveRuffBinary(context);
	const result = await runSubprocess(ruffBinary, ruffLintFixArgs(context, false), {
		cwd: context.rootDirectory,
		timeout: 60000,
	});
	if (result.exitCode !== 0) {
		throw new Error(
			result.stderr || result.stdout || `ruff check --fix exited with code ${result.exitCode}`,
		);
	}
};

export const fixRuffLintForce = async (context: EngineContext): Promise<void> => {
	if (context.files && getPythonTargets(context).length === 0) return;
	const ruffBinary = resolveRuffBinary(context);
	const result = await runSubprocess(ruffBinary, ruffLintFixArgs(context, true), {
		cwd: context.rootDirectory,
		timeout: 60000,
	});
	if (result.exitCode !== 0) {
		throw new Error(
			result.stderr || result.stdout || `ruff check --fix exited with code ${result.exitCode}`,
		);
	}
};
