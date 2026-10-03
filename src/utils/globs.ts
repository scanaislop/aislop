import picomatch from "picomatch";

const MAX_BRACE_EXPANSIONS = 256;

interface BraceList {
	start: number;
	end: number;
	commas: number[];
}

const braceListAt = (pattern: string, start: number): BraceList | null => {
	let depth = 0;
	const commas: number[] = [];
	for (let i = start; i < pattern.length; i += 1) {
		const char = pattern[i];
		if (char === "\\") {
			i += 1;
		} else if (char === "{") {
			depth += 1;
		} else if (char === ",") {
			if (depth === 1) commas.push(i);
		} else if (char === "}") {
			depth -= 1;
			if (depth === 0) return commas.length > 0 ? { start, end: i, commas } : null;
		}
	}
	return null;
};

const findBraceList = (pattern: string): BraceList | null => {
	for (let start = pattern.indexOf("{"); start !== -1; start = pattern.indexOf("{", start + 1)) {
		if (start > 0 && pattern[start - 1] === "\\") continue;
		const list = braceListAt(pattern, start);
		if (list) return list;
	}
	return null;
};

const expandInto = (pattern: string, results: string[]): boolean => {
	const list = findBraceList(pattern);
	if (!list) {
		results.push(pattern);
		return results.length <= MAX_BRACE_EXPANSIONS;
	}
	const bounds = [list.start, ...list.commas, list.end];
	const prefix = pattern.slice(0, list.start);
	const suffix = pattern.slice(list.end + 1);
	for (let i = 0; i < bounds.length - 1; i += 1) {
		const option = pattern.slice(bounds[i] + 1, bounds[i + 1]);
		if (!expandInto(`${prefix}${option}${suffix}`, results)) return false;
	}
	return true;
};

export const expandBraceLists = (pattern: string): string[] => {
	const results: string[] = [];
	return expandInto(pattern, results) ? results : [pattern];
};

const isNegated = (pattern: string): boolean => picomatch.scan(pattern).negated;

export const matchesGlobList = (
	value: string,
	patterns: string[],
	options: picomatch.PicomatchOptions = {},
): boolean => {
	const positives = patterns.filter((pattern) => !isNegated(pattern));
	const negatives = patterns.filter(isNegated).map((pattern) => pattern.slice(1));
	const included = positives.length === 0 || picomatch.isMatch(value, positives, options);
	const excluded = negatives.length > 0 && picomatch.isMatch(value, negatives, options);
	return included && !excluded;
};
