import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	captureWorktree,
	diffFixChanges,
	restoreFixChanges,
} from "../src/commands/fix-rollback.js";
import { resolveProjectChecks } from "../src/commands/fix-checks.js";

const roots: string[] = [];
const fixture = (): string => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-rollback-safety-"));
	roots.push(root);
	return root;
};
const write = (root: string, relative: string, body: string): void => {
	const absolute = path.join(root, relative);
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	fs.writeFileSync(absolute, body);
};
afterEach(() => {
	vi.restoreAllMocks();
	for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe("project check consent", () => {
	it("requires explicit consent for repository-configured commands", () => {
		const config = { fix: { checks: ["repository-command"] } };
		expect(resolveProjectChecks(config)).toMatchObject({ commands: [] });
		expect(resolveProjectChecks(config, { checks: ["explicit-command"] })).toMatchObject({
			commands: ["explicit-command"],
		});
		expect(
			resolveProjectChecks(config, { runChecks: true, checks: ["explicit-command"] }),
		).toMatchObject({
			commands: ["repository-command", "explicit-command"],
		});
	});
});

describe("rollback safety", () => {
	it("limits snapshot reads to the selected files", () => {
		const root = fixture();
		write(root, "src/selected.ts", "before");
		write(root, "src/outside.ts", "outside");
		const before = captureWorktree(root, { files: ["src/selected.ts"] });
		write(root, "src/selected.ts", "fixed");
		write(root, "src/outside.ts", "independent");
		expect(restoreFixChanges(root, before, diffFixChanges(root, before))).toEqual([]);
		expect(fs.readFileSync(path.join(root, "src/selected.ts"), "utf8")).toBe("before");
		expect(fs.readFileSync(path.join(root, "src/outside.ts"), "utf8")).toBe("independent");
	});

	it("respects ignore files and output directories without reading their contents", () => {
		const root = fixture();
		execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
		write(root, ".gitignore", "ignored/\n");
		write(root, ".aislopignore", "scratch/\n");
		for (const dir of ["ignored", "scratch", "dist", ".venv", "target", "custom"]) {
			write(root, `${dir}/large.bin`, "large".repeat(100));
		}
		write(root, "src/app.ts", "small");
		const before = captureWorktree(root, { exclude: ["custom"], maxBytes: 100 });
		expect([...before.files.keys()].sort()).toEqual([".aislopignore", ".gitignore", "src/app.ts"]);
	});

	it("rejects an oversized snapshot before the file is read", () => {
		const root = fixture();
		write(root, "large.bin", "large");
		const read = vi.spyOn(fs, "readFileSync");
		expect(() => captureWorktree(root, { maxBytes: 1 })).toThrow("memory limit");
		expect(read.mock.calls.some(([file]) => file === path.join(root, "large.bin"))).toBe(false);
	});

	it("keeps a file intact when replacement fails and restores subsequent paths", () => {
		const root = fixture();
		write(root, "first.ts", "first-original");
		write(root, "second.ts", "second-original");
		const before = captureWorktree(root);
		write(root, "first.ts", "first-fixed");
		write(root, "second.ts", "second-fixed");
		const changes = diffFixChanges(root, before);
		const rename = fs.renameSync;
		vi.spyOn(fs, "renameSync").mockImplementation((source, destination) => {
			if (destination === path.join(root, "first.ts")) throw new Error("EBUSY");
			return rename(source, destination);
		});
		const failures = restoreFixChanges(root, before, changes);
		expect(failures).toHaveLength(1);
		expect(failures[0]?.path).toBe("first.ts");
		expect(failures[0]?.message).toContain("pre-fix contents saved at");
		expect(fs.readFileSync(path.join(root, "first.ts"), "utf8")).toBe("first-fixed");
		expect(fs.readFileSync(path.join(root, "second.ts"), "utf8")).toBe("second-original");
		const backup = fs.readdirSync(root).find((name) => name.startsWith(".aislop-restore-"));
		expect(backup).toBeDefined();
		expect(fs.readFileSync(path.join(root, backup ?? "missing"), "utf8")).toBe("first-original");
	});

	it("refuses parent symlink substitution without modifying the target", () => {
		const root = fixture();
		const outside = fixture();
		write(root, "src/file.ts", "original");
		write(outside, "file.ts", "outside");
		const before = captureWorktree(root);
		fs.rmSync(path.join(root, "src"), { recursive: true });
		fs.symlinkSync(
			outside,
			path.join(root, "src"),
			process.platform === "win32" ? "junction" : "dir",
		);
		const failures = restoreFixChanges(root, before, [{ path: "src/file.ts", action: "deleted" }]);
		expect(failures[0]?.message).toContain("symbolic link");
		expect(fs.readFileSync(path.join(outside, "file.ts"), "utf8")).toBe("outside");
	});
});
