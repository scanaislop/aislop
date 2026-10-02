import path from "node:path";
import { toPosix } from "./fs-utils.mjs";

export const relativeDiagnosticPath = (repoDirectory, diagnosticPath) => {
	if (!diagnosticPath) return diagnosticPath;
	if (path.isAbsolute(diagnosticPath) && diagnosticPath.startsWith(repoDirectory)) {
		return toPosix(path.relative(repoDirectory, diagnosticPath));
	}
	return toPosix(diagnosticPath);
};

export const topRulesForDiagnostics = (diagnostics, repoDirectory, limit = 5, sampleLimit = 3) => {
	const counts = new Map();

	for (const diagnostic of diagnostics) {
		const current = counts.get(diagnostic.rule) ?? {
			rule: diagnostic.rule,
			count: 0,
			samples: [],
		};
		current.count += 1;
		if (current.samples.length < sampleLimit) {
			current.samples.push({
				severity: diagnostic.severity,
				filePath: relativeDiagnosticPath(repoDirectory, diagnostic.filePath),
				line: diagnostic.line,
				column: diagnostic.column,
				message: diagnostic.message,
			});
		}
		counts.set(diagnostic.rule, current);
	}

	return [...counts.values()]
		.sort((left, right) => {
			if (left.count !== right.count) return right.count - left.count;
			return left.rule.localeCompare(right.rule);
		})
		.slice(0, limit);
};

export const addRuleFinding = (store, repoName, diagnostic, relativePath) => {
	const current = store.get(diagnostic.rule) ?? {
		rule: diagnostic.rule,
		count: 0,
		repos: new Set(),
		samples: [],
	};
	current.count += 1;
	current.repos.add(repoName);
	if (current.samples.length < 3) {
		current.samples.push({
			repo: repoName,
			severity: diagnostic.severity,
			filePath: relativePath,
			line: diagnostic.line,
			message: diagnostic.message,
		});
	}
	store.set(diagnostic.rule, current);
};

export const sortRuleAggregate = (aggregate) =>
	[...aggregate.values()]
		.map((entry) => ({
			rule: entry.rule,
			count: entry.count,
			repos: entry.repos.size,
			samples: entry.samples,
		}))
		.sort((left, right) => {
			if (left.count !== right.count) return right.count - left.count;
			if (left.repos !== right.repos) return right.repos - left.repos;
			return left.rule.localeCompare(right.rule);
		});
