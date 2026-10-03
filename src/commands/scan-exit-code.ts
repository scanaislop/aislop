// Error diagnostics always fail CI; the score threshold only applies when the score is scoreable (a withheld score can't be compared to failBelow).
export const computeScanExitCode = (opts: {
	hasErrors: boolean;
	scoreable: boolean;
	score: number;
	failBelow: number;
	missingTools?: boolean;
	failOnMissingTools?: boolean;
}): number =>
	opts.hasErrors ||
	(opts.scoreable && opts.score < opts.failBelow) ||
	(opts.failOnMissingTools === true && opts.missingTools === true)
		? 1
		: 0;
