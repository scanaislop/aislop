import picomatch from "picomatch";

const MAX_BRACE_EXPANSIONS = 256;

interface BraceList {
	start: number;
	end: number;
	options: string[];
}

const NUMERIC_RANGE_RE = /^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/;
const ALPHA_RANGE_RE = /^([a-zA-Z])\.\.([a-zA-Z])(?:\.\.(-?\d+))?$/;

const rangeValues = (from: number, to: number, rawStep: string | undefined): number[] | null => {
	const step = Math.abs(Number(rawStep ?? 1)) || 1;
	const count = Math.floor(Math.abs(to - from) / step) + 1;
	if (count > MAX_BRACE_EXPANSIONS) return null;
	const direction = to >= from ? 1 : -1;
	return Array.from({ length: count }, (_, i) => from + i * step * direction);
};

const padWidth = (from: string, to: string): number =>
	/^-?0\d/.test(from) || /^-?0\d/.test(to) ? Math.max(from.length, to.length) : 0;

const expandRange = (body: string): string[] | null => {
	const numeric = NUMERIC_RANGE_RE.exec(body);
	if (numeric) {
		const width = padWidth(numeric[1], numeric[2]);
		const values = rangeValues(Number(numeric[1]), Number(numeric[2]), numeric[3]);
		return (
			values?.map((value) => {
				const digits = String(Math.abs(value)).padStart(width - (value < 0 ? 1 : 0), "0");
				return value < 0 ? `-${digits}` : digits;
			}) ?? null
		);
	}
	const alpha = ALPHA_RANGE_RE.exec(body);
	if (alpha) {
		const values = rangeValues(alpha[1].charCodeAt(0), alpha[2].charCodeAt(0), alpha[3]);
		return values?.map((code) => String.fromCharCode(code)) ?? null;
	}
	return null;
};

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
			if (depth !== 0) continue;
			if (commas.length === 0) {
				const options = expandRange(pattern.slice(start + 1, i));
				return options ? { start, end: i, options } : null;
			}
			const bounds = [start, ...commas, i];
			const options = bounds
				.slice(0, -1)
				.map((bound, k) => pattern.slice(bound + 1, bounds[k + 1]));
			return { start, end: i, options };
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
	const prefix = pattern.slice(0, list.start);
	const suffix = pattern.slice(list.end + 1);
	for (const option of list.options) {
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
