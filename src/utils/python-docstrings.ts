// Shared across ai-slop detectors that need to reason about Python
// triple-quoted strings from plain lines. Two related line sets:
//
// - tripleQuotedStringLines: lines inside any multi-line `"""..."""` /
//   `'''...'''` literal. Use to keep string *content* from being read as
//   executable code (a print() sample inside a code-generation template, for
//   example), regardless of what the string is used for at runtime.
// - docstringLines: the subset whose literal is docstring-positioned - the
//   opening delimiter (after optional r/b/u/f prefix letters) is the first
//   thing on its line, making the string a bare expression statement: a
//   module/class/function docstring (PEP 257), an attribute docstring, or a
//   string used as a block comment. An assigned or call-wrapped literal
//   (`config = """..."""`) is a runtime value and is never in this set.
//   Single-line docstrings (open and close on one line) are included.
//
// Bounded line scanner, not a parser: continuation-line literals can be
// docstring-positioned by this heuristic, and f-string expressions are not parsed.

export interface PythonDocstringScan {
	tripleQuotedStringLines: Set<number>;
	docstringLines: Set<number>;
}

export const scanPythonDocstrings = (lines: string[]): PythonDocstringScan => {
	const tripleQuotedStringLines = new Set<number>();
	const docstringLines = new Set<number>();
	let delimiter: string | null = null;
	let isDocstring = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (delimiter?.length === 3) {
			tripleQuotedStringLines.add(i);
			if (isDocstring) docstringLines.add(i);
		}
		let cursor = 0;
		while (cursor < line.length) {
			if (delimiter) {
				if (line[cursor] === "\\") {
					cursor += 2;
				} else if (line.startsWith(delimiter, cursor)) {
					cursor += delimiter.length;
					delimiter = null;
				} else {
					cursor++;
				}
				continue;
			}
			const char = line[cursor];
			if (char === "#") break;
			if (char !== "'" && char !== '"') {
				cursor++;
				continue;
			}
			const triple = char.repeat(3);
			delimiter = line.startsWith(triple, cursor) ? triple : char;
			isDocstring = delimiter.length === 3 && /^\s*[rRuUbBfF]{0,3}$/.test(line.slice(0, cursor));
			if (isDocstring) {
				tripleQuotedStringLines.add(i);
				docstringLines.add(i);
			}
			cursor += delimiter.length;
		}
		if (delimiter?.length === 3) {
			tripleQuotedStringLines.add(i);
		} else if (cursor <= line.length) {
			// Ordinary strings continue across lines only through an escaped newline.
			delimiter = null;
		}
	}
	return { tripleQuotedStringLines, docstringLines };
};
