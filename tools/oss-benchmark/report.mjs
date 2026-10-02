const formatNumber = (value) => (value === null ? "-" : Number(value).toFixed(1));

const escapeCell = (value) => value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");

const renderRuleSamples = (samples) => {
	if (!samples || samples.length === 0) return "-";
	return samples
		.map((sample) => escapeCell(`${sample.repo}:${sample.filePath}:${sample.line} ${sample.message}`))
		.join(" <br> ");
};

const table = (title, header, align, rows) => [
	"",
	`## ${title}`,
	"",
	`| ${header.join(" | ")} |`,
	`|${align.join("|")}|`,
	...rows.map((cells) => `| ${cells.join(" | ")} |`),
];

const ruleTable = (title, rules) =>
	table(
		title,
		["Rule", "Findings", "Repos", "Sample findings"],
		["---", "---:", "---:", "---"],
		rules.map((row) => [row.rule, row.count, row.repos, renderRuleSamples(row.samples)]),
	);

const headerLines = ({ run, cohort }) => [
	"# Trending OSS Benchmark",
	"",
	`- Run ID: ${run.runId}`,
	`- Iteration: ${run.iteration}`,
	`- Manifest: \`${cohort.manifestPath}\``,
	`- Source: ${cohort.source} (${cohort.since})`,
	`- Languages: ${cohort.languages.join(", ")}`,
	`- Scan command: \`${run.scanCommand}\``,
	`- Started: ${run.startedAt}`,
	`- Finished: ${run.finishedAt}`,
];

const summaryLines = ({ summary }) =>
	table(
		"Summary",
		["Repos", "Successful", "Failed", "Avg score", "Median score", "Findings", "Errors", "Warnings", "Fixable"],
		["---", "---:", "---:", "---:", "---:", "---:", "---:", "---:", "---:"],
		[
			[
				summary.totalRepos,
				summary.successfulRepos,
				summary.failedRepos,
				formatNumber(summary.avgScore),
				formatNumber(summary.medianScore),
				summary.findings,
				summary.errors,
				summary.warnings,
				summary.fixable,
			],
		],
	);

const languageLines = ({ byLanguage }) =>
	table(
		"Language Summary",
		["Language", "Repos", "Avg score", "Median score", "Findings", "Errors", "Warnings", "Fixable"],
		["---", "---:", "---:", "---:", "---:", "---:", "---:", "---:"],
		byLanguage.map((row) => [
			row.language,
			row.repos,
			formatNumber(row.avgScore),
			formatNumber(row.medianScore),
			row.findings,
			row.errors,
			row.warnings,
			row.fixable,
		]),
	);

const lowestScoreLines = ({ lowestScores }) =>
	table(
		"Lowest Scores",
		["Repo", "Language", "Score", "Findings", "Errors", "Warnings", "Top rule"],
		["---", "---", "---:", "---:", "---:", "---:", "---"],
		lowestScores
			.slice(0, 10)
			.map((repo) => [
				repo.repo,
				repo.language,
				repo.score,
				repo.findings,
				repo.errors,
				repo.warnings,
				repo.topRule ?? "-",
			]),
	);

const highestFindingLines = ({ highestFindingCounts }) =>
	table(
		"Highest Finding Counts",
		["Repo", "Language", "Findings", "Score", "Top rule"],
		["---", "---", "---:", "---:", "---"],
		highestFindingCounts
			.slice(0, 10)
			.map((repo) => [repo.repo, repo.language, repo.findings, repo.score, repo.topRule ?? "-"]),
	);

const topRuleLines = ({ overallTopRules, byLanguage }) => [
	...ruleTable("Overall Top Rules", overallTopRules.slice(0, 15)),
	...byLanguage.flatMap((language) =>
		ruleTable(`${language.language} Top Rules`, language.topRules.slice(0, 10)),
	),
];

const failureLines = ({ failures }) => {
	if (failures.length === 0) return [];
	return table(
		"Failures",
		["Repo", "Language", "Status", "Message"],
		["---", "---", "---", "---"],
		failures.map((failure) => [
			failure.repo,
			failure.language,
			failure.status,
			escapeCell(failure.message ?? "-").replace(/\n+/g, " "),
		]),
	);
};

const repoResultLines = ({ repos }) =>
	table(
		"Repo Results",
		["Repo", "Language", "Rank", "Score", "Findings", "Errors", "Warnings", "Exit", "Raw scan"],
		["---", "---", "---:", "---:", "---:", "---:", "---:", "---:", "---"],
		repos.map((repo) => [
			repo.repo,
			repo.language,
			repo.rank,
			repo.score,
			repo.findings,
			repo.errors,
			repo.warnings,
			repo.exitCode,
			`\`${repo.scanJsonPath}\``,
		]),
	);

export const renderMarkdownReport = (report) => {
	const lines = [
		...headerLines(report),
		...summaryLines(report),
		...languageLines(report),
		...lowestScoreLines(report),
		...highestFindingLines(report),
		...topRuleLines(report),
		...failureLines(report),
		...repoResultLines(report),
	];
	return `${lines.join("\n")}\n`;
};
