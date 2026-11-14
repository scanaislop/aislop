export interface ScalaCatchBlock {
	index: number;
	clauses: Array<{ pattern: string; body: string; index: number }>;
}

const PRINT_ONLY_STATEMENT_RE =
	/^(?:[\w.]+\.printStackTrace\s*\(\s*\)|println\s*\(.*\)|Console\s*\.\s*(?:println|print|printf)\s*\(.*\)|System\s*\.\s*(?:out|err)\s*\.\s*(?:println|print|printf|format)\s*\(.*\))$/s;
const PAIRS: Record<string, string> = { "{": "}", "(": ")", "[": "]" };
const CLOSERS = new Set(Object.values(PAIRS));

const indentAt = (content: string, index: number): number => {
	const start = content.lastIndexOf("\n", index - 1) + 1;
	return /^[\t ]*/.exec(content.slice(start))?.[0].length ?? 0;
};

const delimitedEnd = (content: string, start: number): number => {
	const stack: string[] = [];
	for (let index = start; index < content.length; index++) {
		const character = content[index];
		if (PAIRS[character]) stack.push(PAIRS[character]);
		else if (CLOSERS.has(character)) {
			if (stack.pop() !== character) return -1;
			if (!stack.length) return index;
		}
	}
	return -1;
};

const nextCode = (content: string, start: number): number =>
	start + (/^\s*/.exec(content.slice(start))?.[0].length ?? 0);

const indentedEnd = (content: string, start: number): number => {
	const indent = indentAt(content, start);
	for (let index = start; index < content.length; index++) {
		if (PAIRS[content[index]]) {
			const end = delimitedEnd(content, index);
			if (end === -1) return content.length;
			index = end;
		} else if (content[index] === "\n") {
			const lineStart = index + 1;
			const newline = content.indexOf("\n", lineStart);
			const line = content.slice(lineStart, newline === -1 ? content.length : newline);
			const nextIndent = indentAt(content, lineStart);
			if (
				line.trim() &&
				(nextIndent < indent || (nextIndent === indent && !/^\s*case\b/.test(line)))
			)
				return lineStart;
		}
	}
	return content.length;
};

const outerDelimiterEnd = (content: string, start: number, end: number): number => {
	for (let index = start; index < end; index++) {
		if (PAIRS[content[index]]) {
			const close = delimitedEnd(content, index);
			if (close === -1) return end;
			index = close;
		} else if (CLOSERS.has(content[index])) return index;
	}
	return end;
};

const clauseArrow = (content: string, start: number): number => {
	for (let index = start; index < content.length; index++) {
		if (PAIRS[content[index]]) {
			const end = delimitedEnd(content, index);
			if (end === -1) return -1;
			index = end;
		} else if (content.startsWith("=>", index)) return index;
		else if (CLOSERS.has(content[index]) || content[index] === ";") return -1;
	}
	return -1;
};

const clausesOf = (content: string, blockStart: number): ScalaCatchBlock["clauses"] => {
	const starts: Array<{ index: number; arrow: number }> = [];
	const tokens = /\b(?:case|match|catch)\b|[{}()[\]]/g;
	for (let token = tokens.exec(content); token; token = tokens.exec(content)) {
		const word = token[0];
		const index = token.index;
		if (content[index - 1] === "`" || content[index + word.length] === "`") continue;
		if (PAIRS[word]) {
			const end = delimitedEnd(content, index);
			if (end === -1) break;
			tokens.lastIndex = end + 1;
		} else if (word === "match" || word === "catch") {
			const start = nextCode(content, index + word.length);
			if (/^case\b/.test(content.slice(start))) tokens.lastIndex = indentedEnd(content, start);
		} else if (word === "case" && !/^\s+(?:class|object)\b/.test(content.slice(index + 4))) {
			const arrow = clauseArrow(content, index + 4);
			if (arrow === -1) continue;
			starts.push({ index, arrow });
			tokens.lastIndex = arrow + 2;
		}
	}
	return starts.map((entry, index) => ({
		pattern: content.slice(entry.index + 4, entry.arrow).trim(),
		body: content.slice(entry.arrow + 2, starts[index + 1]?.index ?? content.length).trim(),
		index: blockStart + entry.index,
	}));
};

export const scalaCatchBlocks = (masked: string): ScalaCatchBlock[] => {
	const blocks: ScalaCatchBlock[] = [];
	for (const match of masked.matchAll(/\bcatch\b/g)) {
		if (masked[match.index - 1] === "`" || masked[match.index + 5] === "`") continue;
		const start = nextCode(masked, match.index + 5);
		if (masked[start] === "{") {
			const end = delimitedEnd(masked, start);
			if (end !== -1)
				blocks.push({
					index: match.index,
					clauses: clausesOf(masked.slice(start + 1, end), start + 1),
				});
		} else if (/^case\b/.test(masked.slice(start))) {
			const end = outerDelimiterEnd(masked, start, indentedEnd(masked, start));
			blocks.push({ index: match.index, clauses: clausesOf(masked.slice(start, end), start) });
		}
	}
	return blocks;
};

const unwrapBody = (body: string): string => {
	let result = body.trim().replace(/;+$/, "").trim();
	while (
		(result[0] === "{" || result[0] === "(") &&
		delimitedEnd(result, 0) === result.length - 1
	) {
		result = result.slice(1, -1).trim().replace(/;+$/, "").trim();
	}
	return result;
};

export const isDiscardedScalaCatch = (body: string): boolean => {
	const content = unwrapBody(body);
	if (!content) return true;
	const statements: string[] = [];
	let start = 0;
	for (let index = 0; index < content.length; index++) {
		if (PAIRS[content[index]]) {
			const end = delimitedEnd(content, index);
			if (end === -1) return false;
			index = end;
		} else if (content[index] === ";" || content[index] === "\n") {
			statements.push(content.slice(start, index));
			start = index + 1;
		}
	}
	statements.push(content.slice(start));
	return statements.every((statement) => {
		const value = unwrapBody(statement);
		return !value || PRINT_ONLY_STATEMENT_RE.test(value);
	});
};
