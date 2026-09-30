import { repoDirectoryFor } from "./repo-sync.mjs";
import { addRuleFinding, relativeDiagnosticPath, sortRuleAggregate } from "./rules.mjs";

const mean = (values) => {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const median = (values) => {
	if (values.length === 0) return null;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[middle];
	return (sorted[middle - 1] + sorted[middle]) / 2;
};

const sumOf = (repos, field) => repos.reduce((sum, repo) => sum + repo[field], 0);

const emptyLanguageSummary = (language) => ({
	language,
	repos: 0,
	scores: [],
	findings: 0,
	errors: 0,
	warnings: 0,
	fixable: 0,
});

const addLanguageTotals = (languageSummaries, repo) => {
	const summary = languageSummaries.get(repo.language) ?? emptyLanguageSummary(repo.language);
	summary.repos += 1;
	summary.scores.push(repo.score);
	summary.findings += repo.findings;
	summary.errors += repo.errors;
	summary.warnings += repo.warnings;
	summary.fixable += repo.fixable;
	languageSummaries.set(repo.language, summary);
};

const addRepoRules = (overallRules, languageRules, repo) => {
	const perLanguageRules = languageRules.get(repo.language) ?? new Map();
	languageRules.set(repo.language, perLanguageRules);
	const [owner, name] = repo.repo.split("/");
	const repoDirectory = repoDirectoryFor(repo.language, owner, name);

	for (const diagnostic of repo.diagnostics) {
		const relativePath = relativeDiagnosticPath(repoDirectory, diagnostic.filePath);
		addRuleFinding(overallRules, repo.repo, diagnostic, relativePath);
		addRuleFinding(perLanguageRules, repo.repo, diagnostic, relativePath);
	}
};

const toRepoSummary = (repo) => ({
	repo: repo.repo,
	language: repo.language,
	rank: repo.rank,
	score: repo.score,
	label: repo.label,
	findings: repo.findings,
	errors: repo.errors,
	warnings: repo.warnings,
	fixable: repo.fixable,
	exitCode: repo.exitCode,
	elapsedMs: repo.elapsedMs,
	sha: repo.sha,
	topRule: repo.topRules[0]?.rule ?? null,
	topRuleCount: repo.topRules[0]?.count ?? 0,
	scanJsonPath: repo.scanJsonPath,
	stderrPath: repo.stderrPath,
});

const languageRow = (language, row, rules) => {
	if (!row) {
		return {
			language,
			repos: 0,
			avgScore: null,
			medianScore: null,
			findings: 0,
			errors: 0,
			warnings: 0,
			fixable: 0,
			topRules: [],
		};
	}

	return {
		language,
		repos: row.repos,
		avgScore: mean(row.scores),
		medianScore: median(row.scores),
		findings: row.findings,
		errors: row.errors,
		warnings: row.warnings,
		fixable: row.fixable,
		topRules: rules ? sortRuleAggregate(rules).slice(0, 10) : [],
	};
};

const cohortInfo = (manifest, manifestPath) => ({
	name: manifest.name,
	generatedAt: manifest.generatedAt,
	manifestPath,
	source: manifest.source,
	since: manifest.since,
	limitPerLanguage: manifest.limitPerLanguage,
	languages: manifest.languages,
	totalRepos: manifest.totalRepos,
});

const overallSummary = (results, successful, failed) => {
	const scores = successful.map((repo) => repo.score);
	return {
		totalRepos: results.length,
		successfulRepos: successful.length,
		failedRepos: failed.length,
		avgScore: mean(scores),
		medianScore: median(scores),
		findings: sumOf(successful, "findings"),
		errors: sumOf(successful, "errors"),
		warnings: sumOf(successful, "warnings"),
		fixable: sumOf(successful, "fixable"),
	};
};

export const aggregateResults = (manifest, results, runMeta) => {
	const successful = results.filter((result) => result.status === "ok");
	const failed = results.filter((result) => result.status !== "ok");
	const overallRules = new Map();
	const languageRules = new Map();
	const languageSummaries = new Map();

	for (const repo of successful) {
		addLanguageTotals(languageSummaries, repo);
		addRepoRules(overallRules, languageRules, repo);
	}

	const repoSummaries = successful
		.map(toRepoSummary)
		.sort((left, right) => left.score - right.score || right.findings - left.findings);

	const byLanguage = manifest.languages
		.map((language) =>
			languageRow(language, languageSummaries.get(language), languageRules.get(language)),
		)
		.sort((left, right) => left.language.localeCompare(right.language));

	return {
		run: runMeta,
		cohort: cohortInfo(manifest, runMeta.manifestPath),
		summary: overallSummary(results, successful, failed),
		byLanguage,
		overallTopRules: sortRuleAggregate(overallRules).slice(0, 20),
		lowestScores: repoSummaries.slice(0, 15),
		highestFindingCounts: [...repoSummaries]
			.sort((left, right) => right.findings - left.findings || left.score - right.score)
			.slice(0, 15),
		repos: repoSummaries,
		failures: failed,
	};
};
