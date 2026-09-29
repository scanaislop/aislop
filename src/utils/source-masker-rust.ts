// Rust needs its own scanner: `'` opens a char literal but also a lifetime
// (`'a`, `'static`), block comments nest, and raw strings (`r#"..."#`) end
// only at a quote followed by the same number of hashes.

const isIdentChar = (c: string | undefined): boolean => c !== undefined && /[A-Za-z0-9_]/.test(c);

// End (exclusive) of a char or byte literal opening at `start`, or -1 when
// the quote starts a lifetime or label instead.
const charLiteralEnd = (content: string, start: number): number => {
	const next = content[start + 1];
	if (next === "\\") {
		// '\n', '\'', '\x7f', '\u{1F600}'
		const close = content.indexOf("'", start + 3);
		const newline = content.indexOf("\n", start);
		return close === -1 || (newline !== -1 && newline < close) ? -1 : close + 1;
	}
	if (next === undefined || next === "\n") return -1;
	// one character, surrogate pairs included: 'a', '{', '😀'
	const width = (next.codePointAt(0) ?? 0) > 0xffff ? 2 : 1;
	return content[start + 1 + width] === "'" ? start + 2 + width : -1;
};

interface RawString {
	bodyStart: number;
	bodyEnd: number;
	resumeAt: number;
}

// `r"..."`, `r#"..."#`, `br#"..."#`, `cr"..."` starting at `i`.
const rawStringAt = (content: string, i: number): RawString | null => {
	let k = i;
	if (content[k] === "b" || content[k] === "c") k++;
	if (content[k] !== "r") return null;
	k++;
	let hashes = 0;
	while (content[k] === "#") {
		hashes++;
		k++;
	}
	if (content[k] !== '"') return null;
	const closing = `"${"#".repeat(hashes)}`;
	const bodyStart = k + 1;
	const end = content.indexOf(closing, bodyStart);
	if (end === -1) return { bodyStart, bodyEnd: content.length, resumeAt: content.length };
	return { bodyStart, bodyEnd: end, resumeAt: end + closing.length };
};

// End (exclusive) of a `"..."` string opening at `start`; strings may span lines.
const quotedStringEnd = (content: string, start: number): number => {
	let k = start + 1;
	while (k < content.length) {
		if (content[k] === "\\") k += 2;
		else if (content[k] === '"') return k + 1;
		else k++;
	}
	return content.length;
};

// End (exclusive) of a nested block comment opening at `start`.
const blockCommentEnd = (content: string, start: number): number => {
	let depth = 0;
	let k = start;
	while (k < content.length) {
		if (content[k] === "/" && content[k + 1] === "*") {
			depth++;
			k += 2;
		} else if (content[k] === "*" && content[k + 1] === "/") {
			depth--;
			k += 2;
			if (depth === 0) return k;
		} else k++;
	}
	return content.length;
};

export const maskRust = (content: string, maskStrings: boolean): string => {
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
		// a prefix only when it starts a token: `bar"` is not `r"`
		const tokenStart = !isIdentChar(content[i - 1]);

		if (tokenStart && (c === "r" || c === "b" || c === "c")) {
			const raw = rawStringAt(content, i);
			if (raw) {
				if (maskStrings) mask(raw.bodyStart, raw.bodyEnd);
				i = raw.resumeAt;
				continue;
			}
			if ((c === "b" || c === "c") && next === '"') {
				i++;
				continue;
			}
		}

		if (c === '"') {
			const end = quotedStringEnd(content, i);
			if (maskStrings) mask(i + 1, end - 1);
			i = end;
			continue;
		}

		if (c === "'") {
			const end = charLiteralEnd(content, i);
			if (end !== -1) {
				if (maskStrings) mask(i + 1, end - 1);
				i = end;
				continue;
			}
			// a lifetime or loop label: `'a`, `'static`, `'outer:`
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
			const end = blockCommentEnd(content, i);
			mask(i, end);
			i = end;
			continue;
		}

		i++;
	}

	return out.join("");
};
