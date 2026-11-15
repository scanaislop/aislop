import { consumeQuotedString } from "./string-literals.js";

type ScalaFrame =
	| { readonly kind: "string"; readonly delimiter: string; readonly interpolated: boolean }
	| { readonly kind: "expression"; depth: number };

interface ScalaMaskState {
	readonly content: string;
	readonly out: string[];
	readonly maskStrings: boolean;
	readonly frames: ScalaFrame[];
	cursor: number;
}

const maskRange = (state: ScalaMaskState, start: number, end: number): void => {
	for (let index = start; index < end; index++) {
		if (state.out[index] !== "\n") state.out[index] = " ";
	}
};

const skipLiteral = (state: ScalaMaskState, end: number): void => {
	if (state.maskStrings) maskRange(state, state.cursor, end);
	state.cursor = end;
};

const scanString = (
	state: ScalaMaskState,
	frame: Extract<ScalaFrame, { kind: "string" }>,
): void => {
	const { content, cursor } = state;
	if (content.startsWith(frame.delimiter, cursor)) {
		state.cursor += frame.delimiter.length;
		state.frames.pop();
		return;
	}
	if (content[cursor] === "\n" && frame.delimiter.length === 1) {
		state.frames.pop();
		return;
	}
	if (frame.interpolated && content[cursor] === "$") {
		if (content[cursor + 1] === "$") {
			skipLiteral(state, cursor + 2);
			return;
		}
		if (content[cursor + 1] === "{") {
			skipLiteral(state, cursor + 2);
			state.frames.push({ kind: "expression", depth: 1 });
			return;
		}
		const identifier = /^[_\p{L}][\p{L}\p{N}_]*/u.exec(content.slice(cursor + 1));
		if (identifier) {
			skipLiteral(state, cursor + 1);
			state.cursor += identifier[0].length;
			return;
		}
	}
	const escaped =
		content[cursor] === "\\" && frame.delimiter.length === 1 && content[cursor + 1] !== "$";
	skipLiteral(state, Math.min(content.length, cursor + (escaped ? 2 : 1)));
};

const blockCommentEnd = (content: string, start: number): number => {
	let cursor = start;
	let depth = 0;
	while (cursor < content.length) {
		if (content.startsWith("/*", cursor)) {
			depth++;
			cursor += 2;
		} else if (content.startsWith("*/", cursor)) {
			depth--;
			cursor += 2;
			if (depth === 0) break;
		} else cursor++;
	}
	return cursor;
};

const scanCode = (
	state: ScalaMaskState,
	frame?: Extract<ScalaFrame, { kind: "expression" }>,
): void => {
	const { content, cursor } = state;
	const character = content[cursor];
	if (character === '"') {
		const delimiter = content.startsWith('"""', cursor) ? '"""' : '"';
		state.frames.push({
			kind: "string",
			delimiter,
			interpolated: /[\p{L}\p{N}_$`]/u.test(content[cursor - 1] ?? ""),
		});
		state.cursor += delimiter.length;
		return;
	}
	if (
		character === "'" &&
		/^'(?:[^'\\\r\n]|\\(?:u[0-9a-fA-F]{4}|.))'/u.test(content.slice(cursor, cursor + 8))
	) {
		const end = consumeQuotedString(content, cursor, character);
		if (state.maskStrings) maskRange(state, cursor + 1, end - 1);
		state.cursor = end;
		return;
	}
	if (content.startsWith("//", cursor) || content.startsWith("/*", cursor)) {
		const newline = content.indexOf("\n", cursor);
		const end = content.startsWith("/*", cursor)
			? blockCommentEnd(content, cursor)
			: newline === -1
				? content.length
				: newline;
		maskRange(state, cursor, end);
		state.cursor = end;
		return;
	}
	if (frame && character === "{") frame.depth++;
	if (frame && character === "}") {
		frame.depth--;
		if (frame.depth === 0) {
			state.frames.pop();
			if (state.maskStrings) maskRange(state, cursor, cursor + 1);
		}
	}
	state.cursor++;
};

export const maskScala = (content: string, maskStrings: boolean): string => {
	const state: ScalaMaskState = {
		content,
		out: content.split(""),
		maskStrings,
		frames: [],
		cursor: 0,
	};
	while (state.cursor < content.length) {
		const frame = state.frames.at(-1);
		if (frame?.kind === "string") scanString(state, frame);
		else scanCode(state, frame);
	}
	return state.out.join("");
};
