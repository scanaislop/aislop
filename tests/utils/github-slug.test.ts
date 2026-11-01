import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectGithubSlug, parseGithubSlug } from "../../src/utils/github-slug.js";

describe("parseGithubSlug", () => {
	it("parses ssh remotes and strips .git", () => {
		expect(parseGithubSlug("git@github.com:scanaislop/aislop.git")).toEqual({
			owner: "scanaislop",
			repo: "aislop",
		});
	});

	it("parses https remotes", () => {
		expect(parseGithubSlug("https://github.com/scanaislop/aislop")).toEqual({
			owner: "scanaislop",
			repo: "aislop",
		});
	});

	it("parses https remotes with an auth token and trailing newline", () => {
		expect(
			parseGithubSlug("https://x-access-token:abc123@github.com/scanaislop/aislop.git\n"),
		).toEqual({
			owner: "scanaislop",
			repo: "aislop",
		});
	});

	it("keeps dots in repo names while stripping a trailing .git", () => {
		expect(parseGithubSlug("git@github.com:vercel/next.js.git")).toEqual({
			owner: "vercel",
			repo: "next.js",
		});
		expect(parseGithubSlug("https://github.com/socketio/socket.io")).toEqual({
			owner: "socketio",
			repo: "socket.io",
		});
	});

	it("parses ssh:// remotes", () => {
		expect(parseGithubSlug("ssh://git@github.com/scanaislop/aislop.git")).toEqual({
			owner: "scanaislop",
			repo: "aislop",
		});
	});

	it("returns null for non-github or malformed remotes", () => {
		expect(parseGithubSlug("git@gitlab.com:foo/bar.git")).toBeNull();
		expect(parseGithubSlug("https://example.com/foo/bar")).toBeNull();
		expect(parseGithubSlug("not a url")).toBeNull();
		expect(parseGithubSlug("")).toBeNull();
	});
});

describe("detectGithubSlug", () => {
	const makeRepo = (remote?: string): string => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-slug-"));
		execSync("git init -q", { cwd: dir });
		if (remote) execSync(`git remote add origin ${remote}`, { cwd: dir });
		return dir;
	};

	it("reads the origin remote", () => {
		expect(detectGithubSlug(makeRepo("git@github.com:scanaislop/aislop.git"))).toEqual({
			owner: "scanaislop",
			repo: "aislop",
		});
	});

	it("returns null when there is no origin remote", () => {
		expect(detectGithubSlug(makeRepo())).toBeNull();
	});

	it("returns null for a non-github origin", () => {
		expect(detectGithubSlug(makeRepo("https://gitlab.com/foo/bar.git"))).toBeNull();
	});
});
