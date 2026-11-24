import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { type ChangedLines, parseUnifiedDiffHunks } from "./change-context.js";
import { projectRelativePosix } from "./paths.js";

const MAX_BUFFER = 50 * 1024 * 1024;

// Separates a missing/unfetched base ref from a genuine empty diff.
export const baseRefExists = (cwd: string, ref: string): boolean => {
	const result = spawnSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
		cwd,
		encoding: "utf-8",
		maxBuffer: MAX_BUFFER,
	});
	return !result.error && result.status === 0;
};

export const getChangedFiles = (cwd: string, base?: string): string[] => {
	const baseRef = base ?? "HEAD";
	const diff = spawnSync(
		"git",
		["diff", "--no-color", "--relative", "--name-only", "-z", "--diff-filter=ACMR", baseRef, "--"],
		{
			cwd,
			encoding: "utf-8",
			maxBuffer: MAX_BUFFER,
		},
	);
	if (diff.error || diff.status !== 0) {
		return !base && !baseRefExists(cwd, "HEAD") ? firstCommitFiles(cwd) : [];
	}
	const names = new Set([...diff.stdout.split("\0").filter(Boolean), ...listUntrackedFiles(cwd)]);
	return Array.from(names, (name) => path.resolve(cwd, name));
};

export const getStagedFiles = (cwd: string): string[] => {
	const result = spawnSync(
		"git",
		["diff", "--no-color", "--relative", "--cached", "--name-only", "-z", "--diff-filter=ACMR"],
		{
			cwd,
			encoding: "utf-8",
			maxBuffer: MAX_BUFFER,
		},
	);
	if (result.error || result.status !== 0) return [];
	return result.stdout
		.split("\0")
		.filter((f) => f.length > 0)
		.map((f) => path.resolve(cwd, f));
};

const listUntrackedFiles = (cwd: string): string[] => {
	const untracked = spawnSync("git", ["ls-files", "-z", "--others", "--exclude-standard"], {
		cwd,
		encoding: "utf-8",
		maxBuffer: MAX_BUFFER,
	});
	if (untracked.error || untracked.status !== 0) return [];
	return untracked.stdout.split("\0").filter((line) => line.length > 0);
};

// With no commit to compare against, every staged or untracked file is new.
const firstCommitFiles = (cwd: string): string[] =>
	[
		...new Set([
			...getStagedFiles(cwd),
			...listUntrackedFiles(cwd).map((name) => path.resolve(cwd, name)),
		]),
	].filter((file) => existsSync(file));

export const getChangedLineMap = (cwd: string, base?: string): Map<string, ChangedLines> => {
	const baseRef = base ?? "HEAD";
	const diff = spawnSync(
		"git",
		["diff", "--no-color", "--no-ext-diff", "--relative", "-U0", "--diff-filter=ACMR", baseRef],
		{
			cwd,
			encoding: "utf-8",
			maxBuffer: MAX_BUFFER,
		},
	);
	if ((diff.error || diff.status !== 0) && !base && !baseRefExists(cwd, "HEAD")) {
		return new Map(
			firstCommitFiles(cwd).map((file) => [projectRelativePosix(cwd, file), { kind: "all" }]),
		);
	}
	const map = !diff.error && diff.status === 0 ? parseUnifiedDiffHunks(diff.stdout) : new Map();
	for (const name of listUntrackedFiles(cwd)) {
		map.set(projectRelativePosix(cwd, path.resolve(cwd, name)), { kind: "all" });
	}
	return map;
};
