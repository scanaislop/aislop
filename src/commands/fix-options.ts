export interface FixOptions {
	verbose: boolean;
	force?: boolean;
	/** Restrict to reversible fixes only (imports, comment removal, safe formatter runs) */
	safe?: boolean;
	dryRun?: boolean;
	changes?: boolean;
	staged?: boolean;
	base?: string;
	/** Agent CLI to launch with remaining issues (e.g. "claude", "codex") */
	agent?: string;
	/** Print the prompt to stdout instead of launching an agent */
	prompt?: boolean;
	showHeader?: boolean;
	printBrand?: boolean;
	/** Explicit project checks, appended after enabled config checks. */
	checks?: string[];
	/** Overrides `fix.checkTimeoutMs` for this run. */
	checkTimeoutMs?: number;
	runChecks?: boolean;
}
