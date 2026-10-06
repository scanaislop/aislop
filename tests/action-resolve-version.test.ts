import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = path.resolve("action/resolve-version.sh");
const SHA = "fbec7d7bc41ee93f61a9b42c7651a2309adbb0ea";

let actionsRoot: string;

const resolve = (requested: string, actionPath: string): string =>
	spawnSync("bash", [SCRIPT, requested, actionPath], { encoding: "utf-8" }).stdout.trim();

const actionDir = (ref: string, version?: string): string => {
	const dir = path.join(actionsRoot, "scanaislop", "aislop", ref);
	fs.mkdirSync(dir, { recursive: true });
	if (version) fs.writeFileSync(path.join(dir, "package.json"), `{\n\t"name": "aislop",\n\t"version": "${version}"\n}\n`);
	return dir;
};

beforeEach(() => {
	actionsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-action-ref-"));
});

afterEach(() => {
	fs.rmSync(actionsRoot, { recursive: true, force: true });
});

describe.skipIf(process.platform === "win32")("action CLI version resolution", () => {
	it("uses an explicit version input as given", () => {
		expect(resolve("0.16.1", actionDir("v0.18.0"))).toBe("0.16.1");
		expect(resolve("latest", actionDir("v0.18.0"))).toBe("latest");
	});

	it("runs the CLI version that matches a release tag ref", () => {
		expect(resolve("", actionDir("v0.18.0"))).toBe("0.18.0");
		expect(resolve("", actionDir("v1.2.3-rc.1"))).toBe("1.2.3-rc.1");
		expect(resolve("", actionDir("v1.2.3+build.5"))).toBe("1.2.3+build.5");
		expect(resolve("", actionDir("v1.2.3-rc.1+build.5"))).toBe("1.2.3-rc.1+build.5");
	});

	it("reads the version from package.json for a commit SHA ref", () => {
		expect(resolve("", actionDir(SHA, "0.18.0"))).toBe("0.18.0");
	});

	it("handles Windows-style action paths", () => {
		expect(resolve("", "D:\\a\\_actions\\scanaislop\\aislop\\v0.18.0")).toBe("0.18.0");
	});

	it("falls back to latest for moving refs and local checkouts", () => {
		expect(resolve("", actionDir("v1"))).toBe("latest");
		expect(resolve("", actionDir("main"))).toBe("latest");
		expect(resolve("", actionDir(SHA))).toBe("latest");
		expect(resolve("", "/home/runner/work/aislop/aislop")).toBe("latest");
	});
});
