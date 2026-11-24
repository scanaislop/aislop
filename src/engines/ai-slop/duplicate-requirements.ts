import path from "node:path";
import { relativePosix } from "../../utils/paths.js";
import { getSourceFilesWithExtras } from "../../utils/source-files.js";
import type { Diagnostic, EngineContext } from "../types.js";
import { isRequirementsFileName, readPythonManifest } from "./python-dependency-parser.js";

export const detectDuplicateRequirements = (context: EngineContext): Diagnostic[] => {
	const findings: Diagnostic[] = [];
	for (const file of getSourceFilesWithExtras(context, [".txt", ".in"])) {
		if (!isRequirementsFileName(path.basename(file))) continue;
		const text = readPythonManifest(file, context.rootDirectory);
		if (!text) continue;
		const seen = new Map<string, number>();
		let continued = false;
		for (const [index, line] of text.split(/\r?\n/).entries()) {
			const entry = line.trim();
			const continuation = continued;
			continued = entry.endsWith("\\");
			if (continuation || !/^[A-Za-z0-9][\w.-]*(?:==[\w.+!-]+)?$/.test(entry)) continue;
			const first = seen.get(entry);
			if (!first) {
				seen.set(entry, index + 1);
				continue;
			}
			findings.push({
				filePath: relativePosix(context.rootDirectory, file),
				engine: "ai-slop",
				rule: "ai-slop/duplicate-requirement",
				severity: "warning",
				message: `Requirement '${entry}' repeats line ${first}`,
				help: "Keep one copy of the identical requirement.",
				line: index + 1,
				column: 1,
				category: "AI Slop",
				fixable: false,
			});
		}
	}
	return findings;
};
