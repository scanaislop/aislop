import path from "node:path";
import { chunkFilePaths, runSubprocess } from "../../utils/subprocess.js";
import { resolveJavaToolInvocation } from "../../utils/tooling.js";
import { detectJavaFormatStyle, getJavaTargets, javaToolFailure } from "../java-targets.js";
import type { Diagnostic, EngineContext } from "../types.js";

const styleArgs = (context: EngineContext): string[] | null => {
	const style = detectJavaFormatStyle(context.rootDirectory);
	if (!style) return null;
	return style === "aosp" ? ["--aosp"] : [];
};

const unformattedDiagnostic = (filePath: string): Diagnostic => ({
	filePath,
	engine: "format",
	rule: "java-formatting",
	severity: "warning",
	message: "Java file is not formatted with google-java-format",
	help: "Run `aislop fix` to format it with google-java-format",
	line: 0,
	column: 0,
	category: "Format",
	fixable: true,
});

export const runJavaFormat = async (context: EngineContext): Promise<Diagnostic[]> => {
	const style = styleArgs(context);
	const targets = getJavaTargets(context);
	if (!style || targets.length === 0) return [];
	const known = new Set(targets);
	const diagnostics: Diagnostic[] = [];
	const tool = resolveJavaToolInvocation("google-java-format");
	for (const batch of chunkFilePaths(
		targets.map((file) => path.resolve(context.rootDirectory, file)),
	)) {
		try {
			const result = await runSubprocess(
				tool.command,
				[...tool.args, ...style, "--dry-run", ...batch],
				{
					cwd: context.rootDirectory,
					timeout: 120000,
				},
			);
			if (result.exitCode !== 0)
				throw new Error(result.stderr || result.stdout || `Exit code ${result.exitCode}`);
			for (const line of result.stdout.split(/\r?\n/)) {
				const filePath = path
					.relative(context.rootDirectory, path.resolve(context.rootDirectory, line.trim()))
					.split(path.sep)
					.join("/");
				if (known.has(filePath)) diagnostics.push(unformattedDiagnostic(filePath));
			}
		} catch (error) {
			diagnostics.push(
				javaToolFailure(
					"format",
					"google-java-format",
					path.relative(context.rootDirectory, batch[0]).split(path.sep).join("/"),
					error,
				),
			);
		}
	}
	return diagnostics;
};

export const fixJavaFormat = async (context: EngineContext): Promise<void> => {
	const style = styleArgs(context);
	const targets = getJavaTargets(context);
	if (!style || targets.length === 0) return;
	const tool = resolveJavaToolInvocation("google-java-format");
	for (const batch of chunkFilePaths(
		targets.map((file) => path.resolve(context.rootDirectory, file)),
	)) {
		const result = await runSubprocess(
			tool.command,
			[...tool.args, ...style, "--replace", ...batch],
			{
				cwd: context.rootDirectory,
				timeout: 120000,
			},
		);
		if (result.exitCode !== 0) {
			throw new Error(
				result.stderr || result.stdout || `google-java-format exited with code ${result.exitCode}`,
			);
		}
	}
};
