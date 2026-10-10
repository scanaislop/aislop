import { consumeQuotedString } from "./string-literals.js";

const TEXT_BLOCK = '"""';

const textBlockEnd = (content: string, bodyStart: number): number => {
	let i = bodyStart;
	while (i < content.length) {
		if (content[i] === "\\") {
			i += 2;
			continue;
		}
		if (content.startsWith(TEXT_BLOCK, i)) return i;
		i++;
	}
	return content.length;
};

export const maskJava = (content: string, maskStrings: boolean): string => {
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
			const bodyEnd = textBlockEnd(content, bodyStart);
			if (maskStrings) mask(bodyStart, bodyEnd);
			i = Math.min(len, bodyEnd + TEXT_BLOCK.length);
			continue;
		}

		if (c === '"' || c === "'") {
			const start = i;
			i = consumeQuotedString(content, i, c);
			if (maskStrings) mask(start + 1, i - 1);
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
			i += 2;
			while (i < len - 1 && !(content[i] === "*" && content[i + 1] === "/")) i++;
			if (i < len - 1) i += 2;
			mask(start, i);
			continue;
		}

		i++;
	}

	return out.join("");
};
