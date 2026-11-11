import { consumeQuotedString } from "./string-literals.js";

const TEXT_BLOCK = '"""';

// Scala differs from the Java masker in three ways: block comments nest,
// triple-quoted strings have no escape sequences, and a leading apostrophe is
// often a symbol literal or an identifier prime rather than a char literal.
export const maskScala = (content: string, maskStrings: boolean): string => {
	const out = content.split("");
	const len = content.length;
	let i = 0;

	const mask = (start: number, end: number) => {
		for (let k = start; k < end; k++) {
			if (out[k] !== "\n") out[k] = " ";
		}
	};

	while (i < len) {
		const c = content[i];
		const next = content[i + 1];

		if (content.startsWith(TEXT_BLOCK, i)) {
			const bodyStart = i + TEXT_BLOCK.length;
			const bodyEnd = content.indexOf(TEXT_BLOCK, bodyStart);
			const end = bodyEnd === -1 ? len : bodyEnd;
			if (maskStrings) mask(bodyStart, end);
			i = bodyEnd === -1 ? len : end + TEXT_BLOCK.length;
			continue;
		}

		if (c === '"') {
			const start = i;
			i = consumeQuotedString(content, i, c);
			if (maskStrings) mask(start + 1, i - 1);
			continue;
		}

		if (c === "'") {
			// Char literal: exactly one character (or one escape sequence)
			// before the closing quote. Anything else is a symbol literal
			// ('name) or an identifier prime, so leave it alone.
			const isCharLiteral =
				content[i + 2] === "'" || (content[i + 1] === "\\" && content[i + 3] === "'");
			if (isCharLiteral) {
				const start = i;
				i = consumeQuotedString(content, i, c);
				if (maskStrings) mask(start + 1, i - 1);
				continue;
			}
			i++;
			continue;
		}

		if (c === "/" && next === "/") {
			const start = i;
			while (i < len && content[i] !== "\n") i++;
			mask(start, i);
			continue;
		}

		if (c === "/" && next === "*") {
			const start = i;
			let depth = 0;
			while (i < len) {
				if (content.startsWith("/*", i)) {
					depth++;
					i += 2;
					continue;
				}
				if (content.startsWith("*/", i)) {
					depth--;
					i += 2;
					if (depth === 0) break;
					continue;
				}
				i++;
			}
			mask(start, i);
			continue;
		}

		i++;
	}

	return out.join("");
};
