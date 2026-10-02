import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ensureDir, PACKAGE_ROOT, relativeToRoot, repoKey, writeJson } from "./fs-utils.mjs";
import { repoHeadSha, syncRepo } from "./repo-sync.mjs";
import { topRulesForDiagnostics } from "./rules.mjs";
import { runCommand } from "./run-command.mjs";

const SCAN_ENV = {
	AISLOP_NO_TELEMETRY: "1",
	DO_NOT_TRACK: "1",
	CI: "1",
	NO_COLOR: "1",
};
const SCAN_ENV_PREFIX = Object.entries(SCAN_ENV)
	.map(([key, value]) => `${key}=${value}`)
	.join(" ");

export const SCAN_COMMAND_TEMPLATE = `${SCAN_ENV_PREFIX} node dist/cli.js scan "<repo>" --json`;

export const ensureBuiltCli = () => {
	const build = spawnSync("pnpm", ["build"], {
		cwd: PACKAGE_ROOT,
		stdio: "inherit",
		shell: process.platform === "win32",
	});
	if (build.status !== 0) {
		throw new Error("pnpm build failed; the benchmark needs a fresh dist/cli.js.");
	}
	return path.join(PACKAGE_ROOT, "dist", "cli.js");
};

const repoIdentity = (repo) => ({
	language: repo.language,
	rank: repo.rank,
	repo: `${repo.owner}/${repo.name}`,
	url: repo.url,
});

const cloneFailure = (repo, startedAt, error) => ({
	...repoIdentity(repo),
	status: "clone_failed",
	startedAt,
	finishedAt: new Date().toISOString(),
	message: error instanceof Error ? error.message : String(error),
});

const executeScan = async ({ repo, repoDirectory, paths, startedAt }) => {
	const startedMs = Date.now();
	const result = await runCommand("node", ["dist/cli.js", "scan", repoDirectory, "--json"], {
		cwd: PACKAGE_ROOT,
		env: SCAN_ENV,
	});
	const elapsedMs = Date.now() - startedMs;
	fs.writeFileSync(paths.stdout, result.stdout);
	fs.writeFileSync(paths.stderr, result.stderr);

	const metadata = {
		...repoIdentity(repo),
		repoDirectory: relativeToRoot(repoDirectory),
		sha: await repoHeadSha(repoDirectory),
		status: "scan_finished",
		startedAt,
		finishedAt: new Date().toISOString(),
		elapsedMs,
		command: `${SCAN_ENV_PREFIX} node dist/cli.js scan ${JSON.stringify(repoDirectory)} --json`,
		exitCode: result.code,
		stdoutPath: relativeToRoot(paths.stdout),
		stderrPath: relativeToRoot(paths.stderr),
	};
	return { metadata, stdout: result.stdout };
};

const parseScanOutput = (stdout) => {
	try {
		return { ok: true, parsed: JSON.parse(stdout) };
	} catch (error) {
		return { ok: false, error };
	}
};

const successResult = (metadata, parsed, scanJsonPath, repoDirectory) => {
	const diagnostics = Array.isArray(parsed.diagnostics) ? parsed.diagnostics : [];
	const summary = parsed.summary;
	const success = {
		...metadata,
		status: "ok",
		scanJsonPath: relativeToRoot(scanJsonPath),
		score: parsed.score,
		label: parsed.label,
		files: summary?.files ?? 0,
		findings: diagnostics.length,
		errors: summary?.errors ?? 0,
		warnings: summary?.warnings ?? 0,
		fixable: summary?.fixable ?? 0,
		reportedElapsed: summary?.elapsed ?? null,
		topRules: topRulesForDiagnostics(diagnostics, repoDirectory),
	};
	return { success, diagnostics };
};

const classifyScan = ({ metadata, stdout, paths, repoDirectory }) => {
	const output = parseScanOutput(stdout);
	if (!output.ok) {
		return { ...metadata, status: "parse_failed", message: "aislop did not produce parseable JSON" };
	}

	const { parsed } = output;
	writeJson(paths.scanJson, parsed);

	if (parsed && typeof parsed === "object" && "error" in parsed) {
		return {
			...metadata,
			status: "scan_failed",
			message: String(parsed.error),
			scanJsonPath: relativeToRoot(paths.scanJson),
		};
	}

	if (parsed.scoreable === false || typeof parsed.score !== "number") {
		return {
			...metadata,
			status: "unscoreable",
			message: "no language aislop scores, so the repo has no score",
			scanJsonPath: relativeToRoot(paths.scanJson),
		};
	}

	return successResult(metadata, parsed, paths.scanJson, repoDirectory);
};

export const scanRepo = async ({ repo, runRoot }) => {
	const repoRunRoot = path.join(runRoot, "repos", repo.language, repoKey(repo));
	ensureDir(repoRunRoot);

	const paths = {
		stdout: path.join(repoRunRoot, "stdout.txt"),
		stderr: path.join(repoRunRoot, "stderr.txt"),
		scanJson: path.join(repoRunRoot, "scan.json"),
		metadata: path.join(repoRunRoot, "metadata.json"),
	};
	const startedAt = new Date().toISOString();

	let repoDirectory;
	try {
		repoDirectory = await syncRepo(repo);
	} catch (error) {
		const failure = cloneFailure(repo, startedAt, error);
		writeJson(paths.metadata, failure);
		return failure;
	}

	const { metadata, stdout } = await executeScan({ repo, repoDirectory, paths, startedAt });
	const outcome = classifyScan({ metadata, stdout, paths, repoDirectory });
	if (!outcome.success) {
		writeJson(paths.metadata, outcome);
		return outcome;
	}

	writeJson(paths.metadata, outcome.success);
	return { ...outcome.success, diagnostics: outcome.diagnostics };
};
