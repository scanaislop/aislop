import fs from "node:fs";
import path from "node:path";
import { scanPythonDocstrings } from "../utils/python-docstrings.js";
import { getProjectSourceFiles } from "../utils/source-files.js";
import type { Diagnostic, EngineContext } from "./types.js";

const facadeImportName = (finding: Diagnostic): string | undefined => {
	if (path.basename(finding.filePath) !== "__init__.py") return;
	if (finding.rule === "ai-slop/unused-import")
		return /^Imported symbol '(\w+)' is never used$/.exec(finding.message)?.[1];
	if (finding.rule === "ruff/F401")
		return /^`(?:[\w.]+\.)?(\w+)` imported but unused/.exec(finding.message)?.[1];
};
export const filterConsumedFacadeImports = (
	findings: Diagnostic[],
	context: EngineContext,
): Diagnostic[] => {
	const packages = new Map<string, Set<string>>();
	for (const finding of findings.filter(facadeImportName)) {
		packages.set(path.resolve(context.rootDirectory, path.dirname(finding.filePath)), new Set());
	}
	if (!packages.size) return findings;
	const parents = new Set([...packages.keys()].map((directory) => path.dirname(directory)));
	for (const file of getProjectSourceFiles(context)) {
		const parent = path.dirname(file);
		if (!file.endsWith(".py") || !parents.has(parent)) continue;
		let source: string;
		try {
			source = fs.readFileSync(file, "utf8");
		} catch {
			continue;
		}
		const lines = source.split("\n");
		const strings = scanPythonDocstrings(lines).tripleQuotedStringLines;
		for (const [index, line] of lines.entries()) {
			if (strings.has(index)) continue;
			const match = /^\s*from\s+(\w+)\s+import\s+(.+)/.exec(line);
			if (!match) continue;
			const names = packages.get(path.join(parent, match[1]));
			if (!names) continue;
			let statement = match[2].split("#")[0];
			if (statement.startsWith("(")) {
				for (let next = index + 1; !statement.includes(")") && next < lines.length; next++) {
					statement += ` ${lines[next].split("#")[0]}`;
				}
			}
			for (const item of statement.replace(/[()]/g, "").split(",")) {
				names.add(item.trim().split(/\s+/)[0]);
			}
		}
	}
	return findings.filter((finding) => {
		const name = facadeImportName(finding);
		return (
			!name ||
			!packages.get(path.resolve(context.rootDirectory, path.dirname(finding.filePath)))?.has(name)
		);
	});
};
