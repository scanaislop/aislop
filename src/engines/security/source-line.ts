/** Returns one-based line numbers for ascending UTF-16 offsets in one pattern's matches. */
export const createLineCounter = (content: string): ((index: number) => number) => {
	let line = 1;
	let nextNewline = content.indexOf("\n");
	return (index) => {
		while (nextNewline !== -1 && nextNewline < index) {
			line++;
			nextNewline = content.indexOf("\n", nextNewline + 1);
		}
		return line;
	};
};
