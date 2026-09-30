import { execSync } from "node:child_process";
import path from "node:path";

const GITHUB_REMOTE_RE =
	/^(?:git@github\.com:|https:\/\/(?:[^@]+@)?github\.com\/)([^/]+)\/([^/\s]+?)(?:\.git)?\s*$/;

export interface GithubSlug {
	owner: string;
	repo: string;
}

export const parseGithubSlug = (remoteUrl: string): GithubSlug | null => {
	const match = remoteUrl.trim().match(GITHUB_REMOTE_RE);
	if (!match) return null;
	const owner = match[1];
	const repo = match[2];
	if (!owner || !repo) return null;
	return { owner, repo };
};

export const detectGithubSlug = (directory: string): GithubSlug | null => {
	let raw: string;
	try {
		raw = execSync("git remote get-url origin", {
			cwd: path.resolve(directory),
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "ignore"],
		});
	} catch {
		return null;
	}
	return parseGithubSlug(raw);
};
