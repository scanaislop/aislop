import fs from "node:fs";
import path from "node:path";
import {
	COHORTS_DIR,
	dateStamp,
	dedupePath,
	info,
	relativeToRoot,
	slugify,
	writeJson,
} from "./fs-utils.mjs";

const TRENDING_SOURCE = "github-trending";

const fetchText = async (url) => {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "aislop-oss-benchmark",
			Accept: "text/html,application/xhtml+xml",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}

	return response.text();
};

const extractTrendingRepos = (html, limit) => {
	const pattern = /<h2 class="h3 lh-condensed">[\s\S]*?<a [^>]*href="\/([^/"\s]+)\/([^/"\s]+)"/g;
	const seen = new Set();
	const repos = [];

	for (const match of html.matchAll(pattern)) {
		const owner = match[1]?.trim();
		const name = match[2]?.trim();
		if (!owner || !name) continue;
		const key = `${owner}/${name}`;
		if (seen.has(key)) continue;
		seen.add(key);
		repos.push({ owner, name, url: `https://github.com/${owner}/${name}` });
		if (repos.length >= limit) break;
	}

	if (repos.length === 0) {
		throw new Error("Unable to extract any repository links from the Trending page.");
	}

	return repos;
};

const fetchLanguageEntries = async (language, limit, since) => {
	const url = `https://github.com/trending/${language}?since=${since}`;
	info(`Fetching ${language} trending repos from ${url}`);
	const repos = extractTrendingRepos(await fetchText(url), limit);
	return repos.map((repo, index) => ({
		language,
		rank: index + 1,
		owner: repo.owner,
		name: repo.name,
		url: repo.url,
		cloneUrl: `${repo.url}.git`,
	}));
};

export const captureTrendingCohort = async ({ languages, limit, since, name, manifestPath }) => {
	const generatedAt = new Date().toISOString();
	const cohortName = name ?? `trending-${since}-${dateStamp()}`;
	const requestedManifestPath = manifestPath ?? path.join(COHORTS_DIR, `${slugify(cohortName)}.json`);
	const finalManifestPath = dedupePath(requestedManifestPath);
	const entries = [];

	for (const language of languages) {
		entries.push(...(await fetchLanguageEntries(language, limit, since)));
	}

	const manifest = {
		name: cohortName,
		generatedAt,
		source: TRENDING_SOURCE,
		since,
		limitPerLanguage: limit,
		languages,
		totalRepos: entries.length,
		repos: entries,
	};

	writeJson(finalManifestPath, manifest);
	info(`Wrote cohort manifest to ${relativeToRoot(finalManifestPath)}`);
	return { manifest, manifestPath: finalManifestPath };
};

export const latestManifestPath = () => {
	if (!fs.existsSync(COHORTS_DIR)) {
		throw new Error("No cohort manifests found. Run capture first.");
	}

	const manifests = fs
		.readdirSync(COHORTS_DIR)
		.filter((entry) => entry.endsWith(".json"))
		.map((entry) => ({
			entry,
			fullPath: path.join(COHORTS_DIR, entry),
			mtime: fs.statSync(path.join(COHORTS_DIR, entry)).mtimeMs,
		}))
		.sort((left, right) => right.mtime - left.mtime);

	if (manifests.length === 0) {
		throw new Error("No cohort manifests found. Run capture first.");
	}

	return manifests[0].fullPath;
};
