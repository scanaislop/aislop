import fs from "node:fs";
import path from "node:path";
import { aggregateResults } from "./aggregate.mjs";
import {
	ensureDir,
	info,
	readJson,
	relativeToRoot,
	RUNS_DIR,
	slugify,
	timestampStamp,
	writeJson,
} from "./fs-utils.mjs";
import { renderMarkdownReport } from "./report.mjs";
import { ensureBuiltCli, SCAN_COMMAND_TEMPLATE, scanRepo } from "./scan-runner.mjs";

const runPool = async (items, jobs, worker) => {
	const results = Array.from({ length: items.length });
	let nextIndex = 0;

	const runners = Array.from({ length: Math.min(jobs, items.length) }, async () => {
		while (nextIndex < items.length) {
			const currentIndex = nextIndex;
			nextIndex += 1;
			results[currentIndex] = await worker(items[currentIndex], currentIndex);
		}
	});

	await Promise.all(runners);
	return results;
};

const writeReports = (runRoot, report) => {
	const summaryJsonPath = path.join(runRoot, "summary.json");
	const summaryMdPath = path.join(runRoot, "summary.md");
	writeJson(summaryJsonPath, report);
	fs.writeFileSync(summaryMdPath, renderMarkdownReport(report));
	info(`Wrote JSON summary to ${relativeToRoot(summaryJsonPath)}`);
	info(`Wrote Markdown summary to ${relativeToRoot(summaryMdPath)}`);
};

const pinRevisions = (manifestPath, manifest, results) => {
	let pinned = 0;
	manifest.repos.forEach((repo, index) => {
		const sha = results[index]?.sha;
		if (repo.revision || !sha) return;
		repo.revision = sha;
		pinned += 1;
	});
	if (pinned === 0) return;
	writeJson(manifestPath, manifest);
	info(`Pinned ${pinned} repo(s) to their scanned revision in ${relativeToRoot(manifestPath)}`);
};

export const runBenchmark = async ({ manifestPath, iteration, jobs }) => {
	ensureBuiltCli();
	const manifest = readJson(manifestPath);
	const iterationName = iteration ?? "pass-1";
	const runId = `${timestampStamp()}-${slugify(iterationName)}`;
	const runRoot = path.join(RUNS_DIR, runId);
	ensureDir(runRoot);

	const startedAt = new Date().toISOString();
	const total = manifest.repos.length;
	info(`Running cohort ${manifest.name} (${total} repos) as ${runId}`);

	const results = await runPool(manifest.repos, jobs, async (repo, index) => {
		info(`[${index + 1}/${total}] ${repo.language} ${repo.owner}/${repo.name}`);
		return scanRepo({ repo, runRoot });
	});

	const report = aggregateResults(manifest, results, {
		runId,
		iteration: iterationName,
		startedAt,
		finishedAt: new Date().toISOString(),
		manifestPath: relativeToRoot(manifestPath),
		runRoot: relativeToRoot(runRoot),
		scanCommand: SCAN_COMMAND_TEMPLATE,
	});

	writeReports(runRoot, report);
	pinRevisions(manifestPath, manifest, results);
	return report;
};
