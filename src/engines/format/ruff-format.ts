import { runSubprocess } from "../../utils/subprocess.js";
import { getPythonTargets, getRuffDiagnosticPath, resolveRuffBinary } from "../python-targets.js";
import type { Diagnostic, EngineContext } from "../types.js";

export const runRuffFormat = async (context: EngineContext): Promise<Diagnostic[]> => {
	const ruffBinary = resolveRuffBinary(context);
	const targets = getPythonTargets(context);
	if (targets.length === 0) return [];

	try {
		const result = await runSubprocess(
			ruffBinary,
			["format", "--check", "--diff", "--force-exclude", ...targets],
			{
				cwd: context.rootDirectory,
				timeout: 60000,
			},
		);

		if (result.exitCode === 0) return [];

		// Ruff format --check outputs files that would be changed
		const output = result.stdout || result.stderr;
		return parseRuffFormatOutput(output, context.rootDirectory);
	} catch {
		return [];
	}
};

const parseRuffFormatOutput = (output: string, rootDir: string): Diagnostic[] => {
	const diagnostics: Diagnostic[] = [];
	const filePattern = /^--- (.+)$/gm;

	for (const match of output.matchAll(filePattern)) {
		const filePath = getRuffDiagnosticPath(rootDir, match[1]);
		diagnostics.push({
			filePath,
			engine: "format",
			rule: "python-formatting",
			severity: "warning",
			message: "Python file is not formatted correctly",
			help: "Run `aislop fix` to auto-format with ruff",
			line: 0,
			column: 0,
			category: "Format",
			fixable: true,
		});
	}

	return diagnostics;
};

export const fixRuffFormat = async (context: EngineContext): Promise<void> => {
	const targets = context.files ? getPythonTargets(context) : [context.rootDirectory];
	if (context.files && targets.length === 0) return;
	const ruffBinary = resolveRuffBinary(context);
	const result = await runSubprocess(ruffBinary, ["format", "--force-exclude", ...targets], {
		cwd: context.rootDirectory,
		timeout: 60000,
	});
	if (result.exitCode !== 0) {
		throw new Error(
			result.stderr || result.stdout || `ruff format exited with code ${result.exitCode}`,
		);
	}
};
