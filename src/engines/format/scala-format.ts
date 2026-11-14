import path from "node:path";
import { fileURLToPath } from "node:url";
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
	for (const batch of chunkFilePaths(
		targets.map((file) => path.resolve(context.rootDirectory, file)),
	)) {
		try {
			const result = await runSubprocess("scalafmt", ["--non-interactive", "--list", ...batch], {
				cwd: context.rootDirectory,
				timeout: 120000,
			});
			if (result.exitCode !== 0 && result.exitCode !== 1)
				throw new Error(
					result.stderr || result.stdout || `scalafmt exited with code ${result.exitCode}`,
				);
			const changed: string[] = [];
			for (const line of result.stdout.split(/\r?\n/)) {
				const outputPath = line.trim().startsWith("file:")
					? fileURLToPath(line.trim())
					: line.trim();
				const filePath = path
					.relative(context.rootDirectory, path.resolve(context.rootDirectory, outputPath))
					.split(path.sep)
					.join("/");
				if (known.has(filePath)) changed.push(filePath);
			}
			if (result.exitCode === 1 && changed.length === 0) {
				throw new Error(
					result.stderr || result.stdout || "scalafmt exited with code 1 without file results",
				);
			}
			diagnostics.push(...changed.map(unformattedDiagnostic));
		} catch (error) {
			diagnostics.push({
				...unformattedDiagnostic(
					path.relative(context.rootDirectory, batch[0]).split(path.sep).join("/"),
				),
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
	for (const batch of chunkFilePaths(
		targets.map((file) => path.resolve(context.rootDirectory, file)),
	)) {
		const result = await runSubprocess("scalafmt", ["--non-interactive", ...batch], {
			cwd: context.rootDirectory,
			timeout: 120000,
		});
		if (result.exitCode !== 0) {
			throw new Error(
				result.stderr || result.stdout || `scalafmt exited with code ${result.exitCode}`,
			);
		}
	}
};
