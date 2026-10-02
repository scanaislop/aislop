import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CLI = path.resolve("dist/cli.js");

const preloadSource = (throwStatement: string) => `
const originalOn = process.on.bind(process);
process.on = (event, listener) => {
	const result = originalOn(event, listener);
	if (event === "uncaughtException") setImmediate(() => { ${throwStatement} });
	return result;
};
`;

describe("CLI fatal error output", () => {
	let dir: string;

	beforeAll(() => {
		dir = mkdtempSync(path.join(tmpdir(), "aislop-fatal-"));
		writeFileSync(
			path.join(dir, "throw.mjs"),
			preloadSource('throw new Error("fatal-uncaught-marker");'),
		);
		writeFileSync(
			path.join(dir, "reject.mjs"),
			preloadSource('Promise.reject(new Error("fatal-rejection-marker"));'),
		);
	});

	afterAll(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	const runWithPreload = (preload: string) =>
		spawnSync(
			process.execPath,
			["--import", pathToFileURL(path.join(dir, preload)).href, CLI, "scan", dir, "--json"],
			{
				encoding: "utf8",
				env: {
					...process.env,
					AISLOP_NO_TELEMETRY: "1",
					AISLOP_NO_UPDATE_NOTIFIER: "1",
					DO_NOT_TRACK: "1",
					CI: "1",
					NO_COLOR: "1",
				},
			},
		);

	it("prints an uncaught exception to stderr and exits 1", () => {
		const result = runWithPreload("throw.mjs");
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("fatal-uncaught-marker");
	});

	it("prints an unhandled rejection to stderr and exits 1", () => {
		const result = runWithPreload("reject.mjs");
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("fatal-rejection-marker");
	});
});
