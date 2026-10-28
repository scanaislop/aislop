import fs from "node:fs";
import path from "node:path";
import { relativePosix } from "../../utils/paths.js";
import { getSourceFiles } from "../../utils/source-files.js";
import { maskComments, maskStringsAndComments } from "../../utils/source-masker.js";
import type { Diagnostic, EngineContext } from "../types.js";

const RULE = "security/invisible-unicode-tags";

const UNICODE_TAG_RE = new RegExp(
	"[" + String.fromCodePoint(0xe0000) + "-" + String.fromCodePoint(0xe007f) + "]",
	"gu",
);
const UNICODE_ESCAPE_JS = new RegExp("\\\\" + "u" + "\\{" + "E00" + "[0-7][0-9A-Fa-f]\\}", "gi");
const UNICODE_ESCAPE_PY = new RegExp("\\\\" + "U000" + "E00" + "[0-7][0-9A-Fa-f]", "gi");

const PRIVILEGED_SLOT_RE = new RegExp(
	[
		"[\"']role[\"']\\s*:\\s*[\"'](?:system|developer)[\"']",
		"\\brole\\s*:\\s*[\"'](?:system|developer)[\"']",
		"\\b(?:system_instruction|system_prompt|systemPrompt|system_message|system)\\s*[:=]",
		"\\b" + "System" + "Message" + "\\s*\\(",
		"[\\[(]\\s*[\"'](?:system|developer)[\"']\\s*,",
	].join("|"),
);

const hasRuleIgnore = (lines: string[], lineIndex: number): boolean => {
	const start = Math.max(0, lineIndex - 2);
	const re =
		/aislop[- ]ignore(?:-file)?\b.*(?:invisible-unicode-tags|security\/invisible-unicode-tags)/i;
	return lines.slice(start, lineIndex + 1).some((line) => re.test(line));
};

const hasFileIgnore = (lines: string[]): boolean => {
	const re =
		/aislop[- ]ignore-file\b.*(?:invisible-unicode-tags|security\/invisible-unicode-tags)/i;
	return lines.slice(0, 10).some((line) => re.test(line));
};

const positionAt = (content: string, index: number): { line: number; column: number } => {
	const line = content.slice(0, index).split("\n").length;
	const column = index - content.lastIndexOf("\n", index - 1);
	return { line, column };
};

const inPromptString = (
	original: string,
	commentsMasked: string,
	fullyMasked: string,
	index: number,
): boolean => {
	if ((commentsMasked[index] ?? "") !== (original[index] ?? "")) return false;
	if ((fullyMasked[index] ?? "") === (original[index] ?? "")) return false;
	const window = commentsMasked.slice(Math.max(0, index - 400), index + 80);
	return PRIVILEGED_SLOT_RE.test(window);
};

const makeDiagnostic = (
	filePath: string,
	message: string,
	line: number,
	column: number,
): Diagnostic => ({
	filePath,
	engine: "security",
	rule: RULE,
	severity: "error",
	message,
	help: "Remove invisible Unicode tag characters. The tag block U+E0000-U+E007F has no legitimate printable presentation in source code",
	line,
	column,
	category: "Security",
	fixable: false,
});

export const scanInvisibleUnicodeTags = async (context: EngineContext): Promise<Diagnostic[]> => {
	const diagnostics: Diagnostic[] = [];
	const patterns = [UNICODE_TAG_RE, UNICODE_ESCAPE_JS, UNICODE_ESCAPE_PY];

	for (const filePath of getSourceFiles(context)) {
		let content: string;
		try {
			content = fs.readFileSync(filePath, "utf-8");
		} catch {
			continue;
		}

		const lines = content.split("\n");
		if (hasFileIgnore(lines)) continue;

		const ext = path.extname(filePath);
		const relativePath = relativePosix(context.rootDirectory, filePath);
		const commentsMasked = maskComments(content, ext);
		const fullyMasked = maskStringsAndComments(content, ext);

		for (const pattern of patterns) {
			pattern.lastIndex = 0;
			let match: RegExpExecArray | null = pattern.exec(content);
			while (match) {
				const matchIndex = match.index ?? 0;
				const { line, column } = positionAt(content, matchIndex);
				if (!hasRuleIgnore(lines, line - 1)) {
					const insidePrompt = inPromptString(content, commentsMasked, fullyMasked, matchIndex);
					diagnostics.push(
						makeDiagnostic(
							relativePath,
							insidePrompt
								? "Invisible Unicode tag characters are inside this system prompt"
								: "Invisible Unicode tag character (U+E0000-U+E007F) detected in source",
							line,
							column,
						),
					);
				}
				if (match[0].length === 0) pattern.lastIndex++;
				match = pattern.exec(content);
			}
		}
	}

	return diagnostics;
};
