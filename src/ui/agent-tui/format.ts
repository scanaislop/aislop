export const fmtTokens = (n: number): string =>
	n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);

export const fmtElapsed = (ms: number): string => {
	const totalSeconds = Math.round(ms / 1000);
	if (totalSeconds < 60) return `${totalSeconds}s`;
	const minutes = Math.floor(totalSeconds / 60);
	return `${minutes}m${String(totalSeconds % 60).padStart(2, "0")}s`;
};

export const fmtFileList = (files: string[], max: number): string => {
	if (files.length <= max) return files.join(", ");
	return `${files.slice(0, max).join(", ")}, +${files.length - max} more`;
};
