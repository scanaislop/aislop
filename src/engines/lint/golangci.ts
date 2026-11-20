import { relativePosix } from "../../utils/paths.js";
import { runSubprocess } from "../../utils/subprocess.js";
import { resolveToolBinary } from "../../utils/tooling.js";
import type { Diagnostic, EngineContext } from "../types.js";

import { parseLintReport } from "./report.js";

interface GolangciIssue {
	FromLinter: string;
	Text: string;
	Pos: { Filename: string; Line: number; Column: number };
}

export const runGolangciLint = async (context: EngineContext): Promise<Diagnostic[]> => {
	const golangciBinary = resolveToolBinary("golangci-lint");
	const run = (flag: string) =>
		runSubprocess(golangciBinary, ["run", flag, "./..."], {
			cwd: context.rootDirectory,
			timeout: 120000,
		});
	let result = await run("--out-format=json");
	if (result.exitCode !== 0 && result.stderr.includes("unknown flag: --out-format")) {
		result = await run("--output.json.path=stdout");
	}
	const parsed = parseLintReport("golangci-lint", result) as { Issues?: GolangciIssue[] | null };
	if (!Object.hasOwn(parsed, "Issues")) throw new Error("golangci-lint report is missing Issues");
	return (parsed.Issues ?? []).map((issue) => ({
		filePath: relativePosix(context.rootDirectory, issue.Pos.Filename),
		engine: "lint" as const,
		rule: `go/${issue.FromLinter}`,
		severity: "warning" as const,
		message: issue.Text,
		help: "",
		line: issue.Pos.Line,
		column: issue.Pos.Column,
		category: "Go Lint",
		fixable: false,
	}));
};
