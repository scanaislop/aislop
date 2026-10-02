import fs from "node:fs";
import path from "node:path";

const NOLINT_RE = /\/\/\s*nolint(?::([\w,-]+))?/;

export type GoPackageSources = Map<string, string[]>;

const packageSources = (filePath: string, cache: GoPackageSources): string[] => {
	const directory = path.dirname(filePath);
	const cached = cache.get(directory);
	if (cached) return cached;
	const sources: string[] = [];
	let entries: string[] = [];
	try {
		entries = fs.readdirSync(directory);
	} catch {
		entries = [];
	}
	for (const name of entries) {
		if (!name.endsWith(".go")) continue;
		try {
			sources.push(fs.readFileSync(path.join(directory, name), "utf-8"));
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

const lastResultIsError = (source: string, afterParams: number): boolean | null => {
	const rest = source.slice(afterParams + 1);
	const trimmed = rest.trimStart();
	if (trimmed.startsWith("(")) {
		const offset = afterParams + 1 + (rest.length - trimmed.length);
		const end = closingParen(source, offset);
		if (end === -1) return null;
		const results = splitTopLevel(source.slice(offset + 1, end));
		const last = results.at(-1);
		if (!last) return false;
		return /^(?:\w+\s+)?error$/.test(last);
	}
	const bodyStart = trimmed.indexOf("{");
	if (bodyStart === -1) return null;
	return trimmed.slice(0, bodyStart).trim() === "error";
};

const declaredResultIsError = (source: string, name: string): boolean | null => {
	const declaration = new RegExp(`^func\\s+${name}\\s*(?:\\[[^\\]]*\\])?\\s*\\(`, "m").exec(source);
	if (!declaration) return null;
	const paramsEnd = closingParen(source, declaration.index + declaration[0].length - 1);
	if (paramsEnd === -1) return null;
	return lastResultIsError(source, paramsEnd);
};

const isNolintErrcheck = (line: string): boolean => {
	const match = NOLINT_RE.exec(line);
	if (!match) return false;
	if (!match[1]) return true;
	return match[1].split(",").some((linter) => linter === "errcheck" || linter === "all");
};

export const isGoDroppedError = (
	content: string,
	matchIndex: number,
	functionName: string,
	filePath: string,
	cache: GoPackageSources,
): boolean => {
	const lineStart = content.lastIndexOf("\n", matchIndex) + 1;
	const lineEnd = content.indexOf("\n", matchIndex);
	if (isNolintErrcheck(content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd))) {
		return false;
	}
	for (const source of [content, ...packageSources(filePath, cache)]) {
		const resolved = declaredResultIsError(source, functionName);
		if (resolved !== null) return resolved;
	}
	return true;
};
