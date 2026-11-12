import path from "node:path";
import { chunkFilePaths, runSubprocess } from "../../utils/subprocess.js";
import { getScalaTargets, hasScalafmtConfig } from "../scala-targets.js";
import type { Diagnostic, EngineContext } from "../types.js";

const unformattedDiagnostic = (filePath: string): Diagnostic => ({
	filePath,
	engine: "format",
	rule: "scala-formatting",
	severity: "warning",
	message: "Scala file is not formatted with scalafmt",
	help: "Run `aislop fix` to format it with scalafmt",
	line: 0,
	column: 0,
	category: "Format",
	fixable: true,
});

export const runScalaFormat = async (context: EngineContext): Promise<Diagnostic[]> => {
	const targets = getScalaTargets(context);
	if (!hasScalafmtConfig(context.rootDirectory) || targets.length === 0) return [];
	const known = new Set(targets);
	const diagnostics: Diagnostic[] = [];
	for (const batch of chunkFilePaths(targets)) {
		try {
			const result = await runSubprocess(
				"scalafmt",
				[
					"--non-interactive",
					"--list",
					...batch.map((file) => path.resolve(context.rootDirectory, file)),
				],
				{
					cwd: context.rootDirectory,
					timeout: 120000,
				},
			);
			if (result.exitCode !== 0)
				throw new Error(
					result.stderr || result.stdout || `scalafmt exited with code ${result.exitCode}`,
				);
			for (const line of result.stdout.split(/\r?\n/)) {
				const filePath = path
					.relative(context.rootDirectory, path.resolve(context.rootDirectory, line.trim()))
					.split(path.sep)
					.join("/");
				if (known.has(filePath)) diagnostics.push(unformattedDiagnostic(filePath));
			}
		} catch (error) {
			diagnostics.push({
				...unformattedDiagnostic(batch[0]),
				severity: "error",
				fixable: false,
				message: `scalafmt failed: ${error instanceof Error ? error.message : String(error)}`,
				help: "Check the scalafmt installation and .scalafmt.conf, then rerun the scan",
			});
		}
	}
	return diagnostics;
};

export const fixScalaFormat = async (context: EngineContext): Promise<void> => {
	const targets = getScalaTargets(context);
	if (!hasScalafmtConfig(context.rootDirectory) || targets.length === 0) return;
	for (const batch of chunkFilePaths(targets)) {
		const result = await runSubprocess(
			"scalafmt",
			["--non-interactive", ...batch.map((file) => path.resolve(context.rootDirectory, file))],
			{
				cwd: context.rootDirectory,
				timeout: 120000,
			},
		);
		if (result.exitCode !== 0) {
			throw new Error(
				result.stderr || result.stdout || `scalafmt exited with code ${result.exitCode}`,
			);
		}
	}
};
