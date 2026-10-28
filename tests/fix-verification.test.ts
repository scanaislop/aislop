import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildPostFixVerificationEngines, fixCommand } from "../src/commands/fix.js";
import {
	boundCommandOutput,
	collectCheckOption,
	resolveProjectChecks,
	runProjectChecks,
} from "../src/commands/fix-checks.js";
import {
	captureWorktree,
	diffFixChanges,
	restoreFixChanges,
} from "../src/commands/fix-rollback.js";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { loadConfig } from "../src/config/index.js";
import type { AislopConfig } from "../src/config/schema.js";
import { resetTelemetryForTests } from "../src/telemetry/client.js";

describe("buildPostFixVerificationEngines", () => {
	it("disables lint during post-fix verification", () => {
		const engines = buildPostFixVerificationEngines(DEFAULT_CONFIG.engines);

		expect(engines.lint).toBe(false);
	});

	it("preserves the user's non-lint engine choices", () => {
		const engines = buildPostFixVerificationEngines({
			...DEFAULT_CONFIG.engines,
			format: false,
			"ai-slop": false,
			architecture: true,
		});

		expect(engines).toEqual({
			...DEFAULT_CONFIG.engines,
			format: false,
			lint: false,
			"ai-slop": false,
			architecture: true,
		});
	});
});

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

const tempRoot = (): string => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-fix-verify-"));
	roots.push(root);
	return root;
};

const writeFile = (root: string, rel: string, body: string | Buffer): void => {
	const abs = path.join(root, rel);
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	fs.writeFileSync(abs, body);
};

const git = (cwd: string, args: string[]): string =>
	execFileSync("git", args, {
		cwd,
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "pipe"],
	});

const initGit = (root: string): void => {
	git(root, ["init", "-b", "main"]);
	git(root, ["config", "user.email", "test@example.com"]);
	git(root, ["config", "user.name", "test"]);
	git(root, ["config", "commit.gpgsign", "false"]);
	git(root, ["config", "core.autocrlf", "false"]);
};

const commitAll = (root: string): void => {
	git(root, ["add", "."]);
	git(root, ["commit", "-m", "init", "--no-verify"]);
};

const FIXABLE = 'import { leftover } from "./missing";\nexport const value = 1;\n';

const quietFixConfig = (fix?: Partial<AislopConfig["fix"]>): AislopConfig => ({
	...DEFAULT_CONFIG,
	engines: {
		...DEFAULT_CONFIG.engines,
		format: false,
		lint: false,
		"code-quality": false,
		architecture: false,
		security: false,
		"ai-slop": true,
	},
	telemetry: { enabled: false },
	exclude: [...DEFAULT_CONFIG.exclude, "checks"],
	fix: { ...DEFAULT_CONFIG.fix, ...fix },
});

const captureStdout = async (run: () => Promise<unknown>): Promise<string> => {
	const chunks: string[] = [];
	const original = process.stdout.write.bind(process.stdout);
	const previousCi = process.env.CI;
	process.env.CI = "1";
	process.stdout.write = ((chunk: unknown) => {
		chunks.push(String(chunk));
		return true;
	}) as typeof process.stdout.write;
	try {
		await run();
		return chunks.join("");
	} finally {
		process.stdout.write = original;
		if (previousCi === undefined) delete process.env.CI;
		else process.env.CI = previousCi;
	}
};

const recordingRail = () => {
	const labels: string[] = [];
	const notes: string[] = [];
	return {
		labels,
		notes,
		rail: {
			start: () => {},
			complete: (step: { label: string; notes?: string[] }) => {
				labels.push(step.label);
				notes.push(...(step.notes ?? []));
			},
		},
	};
};

const writeCheckScripts = (root: string): void => {
	writeFile(root, "checks/fail.js", "process.stderr.write('boom-from-fail');\nprocess.exit(2);\n");
	writeFile(
		root,
		"checks/second.js",
		"require('node:fs').writeFileSync('second-ran.txt', 'yes');\n",
	);
	writeFile(root, "checks/pass.js", "process.exit(0);\n");
	writeFile(root, "checks/sleep.js", "setTimeout(() => {}, 20000);\n");
	writeFile(
		root,
		"checks/order.js",
		"require('node:fs').appendFileSync('order.txt', process.argv[2] || '');\n",
	);
	writeFile(
		root,
		"checks/big.js",
		[
			"process.stdout.write('PREFIX_SENTINEL');",
			"process.stdout.write('x'.repeat(20000));",
			"process.stdout.write('TAIL_MARKER');",
			"process.exit(1);",
		].join("\n"),
	);
	writeFile(
		root,
		"checks/sentinel.js",
		"process.stdout.write('CHECK_OUTPUT_SENTINEL_9f3a2c');\nprocess.exit(1);\n",
	);
	writeFile(
		root,
		"checks/marker.js",
		"require('node:fs').writeFileSync('script-ran.txt', 'yes');\n",
	);
};

const makeFixRepo = (): string => {
	const root = tempRoot();
	initGit(root);
	writeFile(root, "src/app.ts", FIXABLE);
	writeFile(root, "staged.txt", "INDEX-BASE\n");
	writeFile(root, "unstaged.txt", "INDEX-BASE\n");
	commitAll(root);
	writeFile(root, "staged.txt", "USER-STAGED\n");
	git(root, ["add", "staged.txt"]);
	writeFile(root, "unstaged.txt", "USER-UNSTAGED\n");
	writeFile(root, "untracked.txt", "USER-UNTRACKED\n");
	writeCheckScripts(root);
	return root;
};

const worktreeFingerprint = (root: string) => ({
	head: git(root, ["rev-parse", "HEAD"]),
	status: git(root, ["status", "--porcelain", "-uall"]),
	cached: git(root, ["diff", "--cached", "--binary"]),
	stagedBlob: git(root, ["rev-parse", ":staged.txt"]),
	unstagedIndex: git(root, ["show", ":unstaged.txt"]),
	stagedWorktree: fs.readFileSync(path.join(root, "staged.txt")),
	unstagedWorktree: fs.readFileSync(path.join(root, "unstaged.txt")),
	untracked: fs.readFileSync(path.join(root, "untracked.txt")),
	app: fs.readFileSync(path.join(root, "src/app.ts")),
});

describe("resolveProjectChecks", () => {
	it("runs config checks before CLI checks and never invents package scripts", () => {
		expect(collectCheckOption("pnpm lint", collectCheckOption("pnpm test"))).toEqual([
			"pnpm test",
			"pnpm lint",
		]);
		const resolved = resolveProjectChecks(
			{ fix: { checks: ["pnpm typecheck", "pnpm test"], checkTimeoutMs: 120_000 } },
			{ checks: ["pnpm lint"], checkTimeoutMs: 4000 },
		);
		expect(resolved).toEqual({
			commands: ["pnpm typecheck", "pnpm test", "pnpm lint"],
			timeoutMs: 4000,
		});
		expect(resolveProjectChecks(DEFAULT_CONFIG)).toEqual({
			commands: [],
			timeoutMs: 120_000,
		});
	});

	it("rejects a non-positive timeout before any command can run", () => {
		expect(resolveProjectChecks(DEFAULT_CONFIG, { checkTimeoutMs: Number.NaN })).toEqual({
			error: "Project check timeout must be a positive number of milliseconds.",
		});
	});

	it("loads an opted-in list from config without reading package.json scripts", () => {
		const root = tempRoot();
		fs.mkdirSync(path.join(root, ".aislop"));
		writeFile(
			root,
			".aislop/config.yml",
			"fix:\n  checks:\n    - pnpm typecheck\n    - pnpm test\n  checkTimeoutMs: 5000\n",
		);
		writeFile(
			root,
			"package.json",
			JSON.stringify({ scripts: { test: "echo should-not-be-discovered" } }),
		);
		const loaded = loadConfig(root);
		expect(loaded.fix.checks).toEqual(["pnpm typecheck", "pnpm test"]);
		expect(loaded.fix.checkTimeoutMs).toBe(5000);
		expect(loaded.fix.checks).not.toContain("echo should-not-be-discovered");
	});
});

describe("runProjectChecks", () => {
	it("reports passing checks in order", async () => {
		const root = tempRoot();
		writeCheckScripts(root);
		const recorded = recordingRail();
		const failure = await runProjectChecks(
			root,
			["node checks/order.js A", "node checks/order.js B"],
			10_000,
			recorded.rail,
		);
		expect(failure).toBeNull();
		expect(recorded.labels).toEqual([
			"Check passed: node checks/order.js A",
			"Check passed: node checks/order.js B",
		]);
		expect(fs.readFileSync(path.join(root, "order.txt"), "utf-8")).toBe("AB");
	});

	it("stops on a non-zero exit and names that check", async () => {
		const root = tempRoot();
		writeCheckScripts(root);
		const recorded = recordingRail();
		const failure = await runProjectChecks(
			root,
			["node checks/fail.js", "node checks/second.js"],
			10_000,
			recorded.rail,
		);
		expect(failure).toMatchObject({ command: "node checks/fail.js", exitCode: 2, timedOut: false });
		expect(recorded.labels).toEqual(["Check failed: node checks/fail.js (exit 2)"]);
		expect(recorded.notes.join("\n")).toContain("boom-from-fail");
		expect(fs.existsSync(path.join(root, "second-ran.txt"))).toBe(false);
	});

	it("names a timed-out check and returns non-zero", async () => {
		const root = tempRoot();
		writeCheckScripts(root);
		const recorded = recordingRail();
		const failure = await runProjectChecks(root, ["node checks/sleep.js"], 300, recorded.rail);
		expect(failure?.timedOut).toBe(true);
		expect(failure?.exitCode).not.toBe(0);
		expect(recorded.labels).toEqual(["Check timed out: node checks/sleep.js"]);
	});

	it("bounds command output", async () => {
		const root = tempRoot();
		writeCheckScripts(root);
		const recorded = recordingRail();
		const failure = await runProjectChecks(root, ["node checks/big.js"], 10_000, recorded.rail);
		expect(failure?.exitCode).not.toBe(0);
		const notes = recorded.notes.join("\n");
		expect(notes).toContain("[output truncated]");
		expect(notes).toContain("TAIL_MARKER");
		expect(notes).not.toContain("PREFIX_SENTINEL");
		expect(notes.length).toBeLessThan(9_000);
		expect(boundCommandOutput("short", false, 8)).toBe("short");
	});
});

describe("fix rollback", () => {
	it("does not invoke git", () => {
		const source = fs.readFileSync(
			path.join(process.cwd(), "src/commands/fix-rollback.ts"),
			"utf-8",
		);
		expect(source).not.toContain("child_process");
		expect(source).not.toMatch(/\b(spawn|execFile|execSync)\s*\(/);
	});

	it("removes files and directories the fixer created", () => {
		const root = tempRoot();
		writeFile(root, "keep.txt", "keep\n");
		const before = captureWorktree(root);
		writeFile(root, "nested/created.txt", "new\n");
		const changes = diffFixChanges(root, before);
		expect(changes).toEqual([{ path: "nested/created.txt", action: "created" }]);
		writeFile(root, "check-only.txt", "from-check\n");
		restoreFixChanges(root, before, changes);
		expect(fs.existsSync(path.join(root, "nested/created.txt"))).toBe(false);
		expect(fs.existsSync(path.join(root, "nested"))).toBe(false);
		expect(fs.readFileSync(path.join(root, "check-only.txt"), "utf-8")).toBe("from-check\n");
		expect(fs.readFileSync(path.join(root, "keep.txt"), "utf-8")).toBe("keep\n");
	});

	it("restores a deleted file byte for byte, including its mode", () => {
		const root = tempRoot();
		const bytes = Buffer.from([0x00, 0x0d, 0x0a, 0xff, 0x41]);
		writeFile(root, "src/gone.bin", bytes);
		fs.chmodSync(path.join(root, "src/gone.bin"), 0o755);
		const before = captureWorktree(root);
		fs.unlinkSync(path.join(root, "src/gone.bin"));
		const changes = diffFixChanges(root, before);
		expect(changes.map((change) => change.action)).toEqual(["deleted"]);
		restoreFixChanges(root, before, changes);
		const abs = path.join(root, "src/gone.bin");
		expect(fs.readFileSync(abs).equals(bytes)).toBe(true);
		expect(fs.statSync(abs).mode & 0o777).toBe(0o755);
	});

	it("keeps staged, unstaged, and untracked bytes intact", () => {
		const root = tempRoot();
		initGit(root);
		writeFile(root, "staged.txt", "INDEX-BASE\n");
		writeFile(root, "unstaged.txt", "INDEX-BASE\n");
		writeFile(root, "deleted.txt", Buffer.from([0x01, 0x02, 0x03]));
		fs.chmodSync(path.join(root, "deleted.txt"), 0o755);
		writeFile(root, "untouched.txt", "KEEP\n");
		commitAll(root);
		writeFile(root, "staged.txt", "USER-STAGED\n");
		git(root, ["add", "staged.txt"]);
		writeFile(root, "unstaged.txt", "USER-UNSTAGED\n");
		writeFile(root, "untracked.txt", "USER-UNTRACKED\n");
		const untouchedMtime = fs.statSync(path.join(root, "untouched.txt")).mtimeMs;
		const head = git(root, ["rev-parse", "HEAD"]);
		const reflog = git(root, ["reflog"]);
		const status = git(root, ["status", "--porcelain", "-uall"]);

		const before = captureWorktree(root);
		writeFile(root, "staged.txt", "FIXER\n");
		writeFile(root, "unstaged.txt", "FIXER\n");
		writeFile(root, "untracked.txt", "FIXER\n");
		fs.unlinkSync(path.join(root, "deleted.txt"));
		writeFile(root, "nested/created.txt", "created\n");
		const changes = diffFixChanges(root, before);
		const actions = Object.fromEntries(changes.map((change) => [change.path, change.action]));
		expect(actions["staged.txt"]).toBe("modified");
		expect(actions["unstaged.txt"]).toBe("modified");
		expect(actions["untracked.txt"]).toBe("modified");
		expect(actions["deleted.txt"]).toBe("deleted");
		expect(actions["nested/created.txt"]).toBe("created");
		expect(actions["untouched.txt"]).toBeUndefined();

		restoreFixChanges(root, before, changes);

		expect(fs.readFileSync(path.join(root, "staged.txt"), "utf-8")).toBe("USER-STAGED\n");
		expect(fs.readFileSync(path.join(root, "unstaged.txt"), "utf-8")).toBe("USER-UNSTAGED\n");
		expect(fs.readFileSync(path.join(root, "untracked.txt"), "utf-8")).toBe("USER-UNTRACKED\n");
		expect(
			fs.readFileSync(path.join(root, "deleted.txt")).equals(Buffer.from([0x01, 0x02, 0x03])),
		).toBe(true);
		expect(fs.statSync(path.join(root, "deleted.txt")).mode & 0o777).toBe(0o755);
		expect(fs.existsSync(path.join(root, "nested"))).toBe(false);
		expect(fs.readFileSync(path.join(root, "untouched.txt"), "utf-8")).toBe("KEEP\n");
		expect(fs.statSync(path.join(root, "untouched.txt")).mtimeMs).toBe(untouchedMtime);
		expect(git(root, ["rev-parse", "HEAD"])).toBe(head);
		expect(git(root, ["show", ":staged.txt"])).toBe("USER-STAGED\n");
		expect(git(root, ["show", ":unstaged.txt"])).toBe("INDEX-BASE\n");
		expect(git(root, ["status", "--porcelain", "-uall"])).toBe(status);
		expect(git(root, ["reflog"])).toBe(reflog);
		expect(() => git(root, ["ls-files", "--error-unmatch", "untracked.txt"])).toThrow();
	});
});

describe("fix command project checks", () => {
	it("reports passing checks and keeps the applied fix", async () => {
		const root = makeFixRepo();
		let exitCode = -1;
		const output = await captureStdout(async () => {
			const result = await fixCommand(
				root,
				quietFixConfig({
					checks: ["node checks/order.js A", "node checks/order.js B"],
					checkTimeoutMs: 10_000,
				}),
				{ verbose: false },
			);
			exitCode = result.exitCode;
		});
		expect(exitCode).toBe(0);
		const first = output.indexOf("Check passed: node checks/order.js A");
		const second = output.indexOf("Check passed: node checks/order.js B");
		expect(first).toBeGreaterThanOrEqual(0);
		expect(first).toBeLessThan(second);
		expect(fs.readFileSync(path.join(root, "order.txt"), "utf-8")).toBe("AB");
		expect(fs.readFileSync(path.join(root, "src/app.ts"), "utf-8")).not.toContain("leftover");
	});

	it("rolls back a failed check and leaves a dirty worktree intact", async () => {
		const root = makeFixRepo();
		const before = worktreeFingerprint(root);
		let exitCode = -1;
		const output = await captureStdout(async () => {
			const result = await fixCommand(
				root,
				quietFixConfig({
					checks: ["node checks/fail.js", "node checks/second.js"],
					checkTimeoutMs: 10_000,
				}),
				{ verbose: false },
			);
			exitCode = result.exitCode;
		});
		expect(exitCode).not.toBe(0);
		expect(output).toContain("Check failed: node checks/fail.js (exit 2)");
		expect(output).toContain("Rolled back files changed by this fix");
		expect(output).not.toContain("checks/second.js");
		expect(fs.existsSync(path.join(root, "second-ran.txt"))).toBe(false);
		expect(worktreeFingerprint(root)).toEqual(before);
		expect(fs.readFileSync(path.join(root, "src/app.ts"), "utf-8")).toContain("leftover");
	});

	it("rolls back when a check times out", async () => {
		const root = makeFixRepo();
		const before = worktreeFingerprint(root);
		let exitCode = -1;
		const output = await captureStdout(async () => {
			const result = await fixCommand(
				root,
				quietFixConfig({ checks: ["node checks/sleep.js"], checkTimeoutMs: 400 }),
				{ verbose: false },
			);
			exitCode = result.exitCode;
		});
		expect(exitCode).not.toBe(0);
		expect(output).toContain("Check timed out: node checks/sleep.js");
		expect(output).toContain("Rolled back files changed by this fix");
		expect(worktreeFingerprint(root)).toEqual(before);
	});

	it("does not run package.json scripts unless checks are configured", async () => {
		const root = makeFixRepo();
		writeFile(
			root,
			"package.json",
			JSON.stringify({
				scripts: { test: "node checks/marker.js", build: "node checks/marker.js" },
			}),
		);
		let exitCode = -1;
		await captureStdout(async () => {
			const result = await fixCommand(root, quietFixConfig(), { verbose: false });
			exitCode = result.exitCode;
		});
		expect(exitCode).toBe(0);
		expect(fs.existsSync(path.join(root, "script-ran.txt"))).toBe(false);
	});

	it("skips project checks during dry-run", async () => {
		const root = makeFixRepo();
		const before = fs.readFileSync(path.join(root, "src/app.ts"));
		const output = await captureStdout(() =>
			fixCommand(
				root,
				quietFixConfig({ checks: ["node checks/marker.js"], checkTimeoutMs: 10_000 }),
				{ verbose: false, dryRun: true },
			),
		);
		expect(output).toContain("Project checks skipped during dry-run");
		expect(fs.existsSync(path.join(root, "script-ran.txt"))).toBe(false);
		expect(fs.readFileSync(path.join(root, "src/app.ts")).equals(before)).toBe(true);
	});

	it("does not send check output to telemetry", async () => {
		const root = makeFixRepo();
		const previousEnv = { ...process.env };
		delete process.env.AISLOP_NO_TELEMETRY;
		delete process.env.DO_NOT_TRACK;
		delete process.env.CI;
		process.env.AISLOP_TELEMETRY_DEBUG = "1";
		process.env.AISLOP_TELEMETRY_DRY_RUN = "1";
		resetTelemetryForTests();
		const stderr: string[] = [];
		const stdout: string[] = [];
		const originalErr = process.stderr.write;
		const originalOut = process.stdout.write;
		process.stderr.write = ((chunk: unknown) => {
			stderr.push(String(chunk));
			return true;
		}) as typeof process.stderr.write;
		process.stdout.write = ((chunk: unknown) => {
			stdout.push(String(chunk));
			return true;
		}) as typeof process.stdout.write;
		try {
			const config = quietFixConfig({
				checks: ["node checks/sentinel.js"],
				checkTimeoutMs: 10_000,
			});
			config.telemetry = { enabled: true };
			const result = await fixCommand(root, config, { verbose: false });
			expect(result.exitCode).not.toBe(0);
		} finally {
			process.stderr.write = originalErr;
			process.stdout.write = originalOut;
			process.env = previousEnv;
			resetTelemetryForTests();
		}
		const err = stderr.join("");
		const out = stdout.join("");
		expect(out).toContain("CHECK_OUTPUT_SENTINEL_9f3a2c");
		expect(out).toContain("Check failed: node checks/sentinel.js");
		expect(err).not.toContain("CHECK_OUTPUT_SENTINEL_9f3a2c");
		expect(err).not.toMatch(/dropped non-allowlisted property: .*(output|stdout|stderr)/);
	});
});
