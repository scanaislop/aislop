import fs from "node:fs";
import path from "node:path";
import { ensureDir, info, REPOS_DIR, repoKey } from "./fs-utils.mjs";
import { runCommand } from "./run-command.mjs";

export const repoDirectoryFor = (language, owner, name) =>
	path.join(REPOS_DIR, language, repoKey({ owner, name }));

const cloneRepo = async (repo, repoDirectory) => {
	const result = await runCommand("git", [
		"clone",
		"--depth",
		"1",
		"--single-branch",
		repo.cloneUrl,
		repoDirectory,
	]);
	if (result.code !== 0) {
		throw new Error(result.stderr.trim() || result.stdout.trim() || "git clone failed");
	}
	return repoDirectory;
};

const checkoutRevision = async (repo, repoDirectory) => {
	const git = (...args) => runCommand("git", ["-C", repoDirectory, ...args]);
	const fetched = await git("fetch", "--depth", "1", "origin", repo.revision);
	const checkedOut = fetched.code === 0 && (await git("checkout", "--detach", repo.revision));
	if (!checkedOut || checkedOut.code !== 0) {
		throw new Error(`could not check out pinned revision ${repo.revision}`);
	}
	return repoDirectory;
};

export const syncRepo = async (repo) => {
	const repoDirectory = repoDirectoryFor(repo.language, repo.owner, repo.name);
	ensureDir(path.dirname(repoDirectory));

	if (repo.revision) {
		if (!fs.existsSync(repoDirectory)) await cloneRepo(repo, repoDirectory);
		return checkoutRevision(repo, repoDirectory);
	}

	if (!fs.existsSync(repoDirectory)) {
		info(`Cloning ${repo.owner}/${repo.name}`);
		return cloneRepo(repo, repoDirectory);
	}

	info(`Updating ${repo.owner}/${repo.name}`);
	const pullResult = await runCommand("git", ["-C", repoDirectory, "pull", "--ff-only"]);
	if (pullResult.code === 0) return repoDirectory;

	info(`Re-cloning ${repo.owner}/${repo.name} after pull failure`);
	fs.rmSync(repoDirectory, { recursive: true, force: true });
	return cloneRepo(repo, repoDirectory);
};

export const repoHeadSha = async (repoDirectory) => {
	const result = await runCommand("git", ["-C", repoDirectory, "rev-parse", "HEAD"]);
	if (result.code !== 0) return null;
	return result.stdout.trim() || null;
};
