// npx runs the CLI from npm's `_npx` cache where `aislop` isn't on PATH, so suggest the npx form.
export const detectInvocation = (): string => {
	const underNpx = (process.argv[1] ?? "").includes("_npx") || import.meta.url.includes("_npx");
	return underNpx ? "npx aislop@latest" : "aislop";
};
