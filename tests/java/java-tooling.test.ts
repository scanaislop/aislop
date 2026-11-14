import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isToolAvailable, resolveJavaToolInvocation } from "../../src/utils/tooling.js";
import * as subprocess from "../../src/utils/subprocess.js";

let root: string;
let originalPath: string | undefined;
const statSync = fs.statSync;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-tooling-"));
	originalPath = process.env.PATH;
	process.env.PATH = root;
});
afterEach(() => {
	process.env.PATH = originalPath;
	vi.restoreAllMocks();
	fs.rmSync(root, { recursive: true, force: true });
});

const bundledJar = (name: string): void => {
	const jar = path.join(root, "fixture.jar");
	fs.writeFileSync(jar, "test fixture");
	const stats = statSync(jar);
	vi.spyOn(fs, "statSync").mockImplementation(((candidate: fs.PathLike, options?: { throwIfNoEntry?: boolean }) => {
		if (String(candidate).includes(`${path.sep}tools${path.sep}java${path.sep}`)) {
			return String(candidate).includes(`${path.sep}${name}-`) ? stats : undefined;
		}
		return statSync(candidate, options);
	}) as typeof fs.statSync);
};

describe("Java tool resolution", () => {
	it("prefers an executable system installation over a bundled jar", () => {
		bundledJar("pmd");
		const executable = path.join(root, process.platform === "win32" ? "pmd.exe" : "pmd");
		fs.writeFileSync(executable, "", { mode: 0o755 });
		expect(resolveJavaToolInvocation("pmd")).toEqual({ command: executable, args: [] });
	});

	it("runs bundled PMD through its Java main class without a shell wrapper", () => {
		bundledJar("pmd");
		const tool = resolveJavaToolInvocation("pmd");
		expect(tool.command).toBe("java");
		expect(tool.args[0]).toBe("-cp");
		expect(tool.args[1]).toContain(path.join("pmd-bin-7.29.0", "lib", "*"));
		expect(tool.args[2]).toBe("net.sourceforge.pmd.cli.PmdCli");
	});

	it("requires Java on PATH before advertising bundled tools as available", async () => {
		bundledJar("checkstyle");
		const installed = vi.spyOn(subprocess, "isToolInstalled").mockResolvedValue(false);
		expect(await isToolAvailable("checkstyle")).toBe(false);
		expect(installed).toHaveBeenCalledWith("java");
		installed.mockResolvedValue(true);
		expect(await isToolAvailable("checkstyle")).toBe(true);
	});
});
