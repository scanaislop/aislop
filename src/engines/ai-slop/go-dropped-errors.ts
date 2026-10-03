import fs from "node:fs";
import path from "node:path";
import { maskComments, maskStringsAndComments } from "../../utils/source-masker.js";

const NOLINT_RE = /\/\/\s*nolint(?::([\w,-]+))?/g;
const PACKAGE_RE = /^package\s+(\w+)/m;
const NON_ERROR_BASIC_TYPES = new Set([
	"bool",
	"string",
	"byte",
	"rune",
	"int",
	"int8",
	"int16",
	"int32",
	"int64",
	"uint",
	"uint8",
	"uint16",
	"uint32",
	"uint64",
	"uintptr",
	"float32",
	"float64",
	"complex64",
	"complex128",
]);
const NON_ERROR_COMPOSITE_RE = /^(?:\[\d*\]|map\[|chan\b|<-\s*chan\b|func\s*\()/;

interface GoSource {
	path: string;
	masked: string;
}

export type GoPackageSources = Map<string, GoSource[]>;

const maskGo = (source: string): string => maskStringsAndComments(source, ".go");

const packageName = (maskedSource: string): string | null =>
	PACKAGE_RE.exec(maskedSource)?.[1] ?? null;

const packageSources = (filePath: string, cache: GoPackageSources): GoSource[] => {
	const directory = path.dirname(filePath);
	const cached = cache.get(directory);
	if (cached) return cached;
	const sources: GoSource[] = [];
	let entries: string[];
	try {
		entries = fs.readdirSync(directory);
	} catch {
		entries = [];
	}
	for (const name of entries) {
		if (!name.endsWith(".go")) continue;
		const sourcePath = path.join(directory, name);
		try {
			sources.push({ path: sourcePath, masked: maskGo(fs.readFileSync(sourcePath, "utf-8")) });
		} catch {
			continue;
		}
	}
	cache.set(directory, sources);
	return sources;
};

const closingParen = (source: string, openIndex: number): number => {
	let depth = 0;
	for (let i = openIndex; i < source.length; i += 1) {
		if (source[i] === "(") depth += 1;
		else if (source[i] === ")") {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	return -1;
};

const splitTopLevel = (list: string): string[] => {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < list.length; i += 1) {
		const char = list[i];
		if (char === "(" || char === "[" || char === "{") depth += 1;
		else if (char === ")" || char === "]" || char === "}") depth -= 1;
		else if (char === "," && depth === 0) {
			parts.push(list.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(list.slice(start));
	return parts.map((part) => part.trim()).filter(Boolean);
};

const resultTypeOf = (result: string): string => {
	const named = /^\w+\s+(\S.*)$/.exec(result);
	if (named && !/^(?:map|chan|func)$/.test(result.split(/\s/)[0])) return named[1].trim();
	return result;
};

const isKnownNonError = (type: string): boolean =>
	NON_ERROR_BASIC_TYPES.has(type) || NON_ERROR_COMPOSITE_RE.test(type);

const lastResultType = (source: string, paramsEnd: number): string | null => {
	const rest = source.slice(paramsEnd + 1);
	const trimmed = rest.trimStart();
	if (trimmed.startsWith("(")) {
		const offset = paramsEnd + 1 + (rest.length - trimmed.length);
		const end = closingParen(source, offset);
		if (end === -1) return null;
		const last = splitTopLevel(source.slice(offset + 1, end)).at(-1);
		return last ? resultTypeOf(last) : null;
	}
	const bodyStart = trimmed.indexOf("{");
	if (bodyStart === -1) return null;
	return trimmed.slice(0, bodyStart).trim() || null;
};

const declaredLastResults = (maskedSource: string, name: string): (string | null)[] => {
	const declaration = new RegExp(`^func\\s+${name}\\s*(?:\\[[^\\]]*\\])?\\s*\\(`, "gm");
	const results: (string | null)[] = [];
	for (const match of maskedSource.matchAll(declaration)) {
		const paramsEnd = closingParen(maskedSource, match.index + match[0].length - 1);
		results.push(paramsEnd === -1 ? null : lastResultType(maskedSource, paramsEnd));
	}
	return results;
};

const enclosingScopeBefore = (maskedSource: string, index: number): string => {
	const before = maskedSource.slice(0, index);
	const funcStart = before.lastIndexOf("\nfunc ");
	return before.slice(funcStart === -1 ? 0 : funcStart);
};

const isShadowed = (scope: string, name: string): boolean => {
	if (new RegExp(`\\bvar\\s+${name}\\b|[(,]\\s*${name}\\s+func\\b`).test(scope)) return true;
	for (const line of scope.split("\n")) {
		const assign = line.indexOf(":=");
		if (assign === -1) continue;
		const lhs = line.slice(0, assign).replace(/^\s*(?:for|if|switch)\s+/, "");
		if (lhs.split(",").some((part) => part.trim() === name)) return true;
	}
	return false;
};

const isCommentText = (line: string, commentMaskedLine: string, index: number): boolean =>
	line[index] !== commentMaskedLine[index];

const startsLineComment = (line: string, commentMaskedLine: string, index: number): boolean => {
	if (commentMaskedLine.slice(index, index + 2).trim() !== "") return false;
	let previous = index - 1;
	while (previous >= 0 && /\s/.test(line[previous])) previous -= 1;
	if (previous < 0) return true;
	if (line.slice(previous - 1, previous + 1) === "*/") return true;
	return !isCommentText(line, commentMaskedLine, previous);
};

const hasNolintErrcheck = (line: string, commentMaskedLine: string): boolean => {
	for (const match of line.matchAll(NOLINT_RE)) {
		if (!startsLineComment(line, commentMaskedLine, match.index)) continue;
		if (!match[1]) return true;
		if (match[1].split(",").some((linter) => linter === "errcheck" || linter === "all")) {
			return true;
		}
	}
	return false;
};

const lineAt = (source: string, index: number): string => {
	const start = source.lastIndexOf("\n", index) + 1;
	const end = source.indexOf("\n", index);
	return source.slice(start, end === -1 ? undefined : end);
};

export const createGoDroppedErrorCheck = (
	content: string,
	filePath: string,
	cache: GoPackageSources,
): ((matchIndex: number, functionName: string) => boolean) => {
	const masked = maskGo(content);
	const commentMasked = maskComments(content, ".go");
	const ownPackage = packageName(masked);
	return (matchIndex, functionName) => {
		if (hasNolintErrcheck(lineAt(content, matchIndex), lineAt(commentMasked, matchIndex))) {
			return false;
		}
		if (isShadowed(enclosingScopeBefore(masked, matchIndex), functionName)) return true;
		const samePackage = packageSources(filePath, cache)
			.filter((source) => source.path !== filePath && packageName(source.masked) === ownPackage)
			.map((source) => source.masked);
		const results = [masked, ...samePackage].flatMap((source) =>
			declaredLastResults(source, functionName),
		);
		if (results.length === 0) return true;
		return !results.every((type) => type !== null && isKnownNonError(type));
	};
};
