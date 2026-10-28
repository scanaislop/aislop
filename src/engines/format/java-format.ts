import { chunkFilePaths, runSubprocess } from "../../utils/subprocess.js";
import { detectJavaFormatStyle, getJavaTargets } from "../java-targets.js";
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
	for (const batch of chunkFilePaths(targets)) {
		try {
			const result = await runSubprocess("google-java-format", [...style, "--dry-run", ...batch], {
				cwd: context.rootDirectory,
				timeout: 120000,
			});
			for (const line of result.stdout.split(/\r?\n/)) {
				const filePath = line.trim().replaceAll("\\", "/");
				if (known.has(filePath)) diagnostics.push(unformattedDiagnostic(filePath));
			}
		} catch {
			continue;
		}
	}
	return diagnostics;
};

export const fixJavaFormat = async (context: EngineContext): Promise<void> => {
	const style = styleArgs(context);
	const targets = getJavaTargets(context);
	if (!style || targets.length === 0) return;
	for (const batch of chunkFilePaths(targets)) {
		const result = await runSubprocess("google-java-format", [...style, "--replace", ...batch], {
			cwd: context.rootDirectory,
			timeout: 120000,
		});
		if (result.exitCode !== 0) {
			throw new Error(
				result.stderr || result.stdout || `google-java-format exited with code ${result.exitCode}`,
			);
		}
	}
};
