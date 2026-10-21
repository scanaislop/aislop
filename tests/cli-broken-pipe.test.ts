import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CLI = path.resolve("dist/cli.js");

const env = {
	...process.env,
	AISLOP_NO_TELEMETRY: "1",
	AISLOP_NO_UPDATE_NOTIFIER: "1",
	DO_NOT_TRACK: "1",
	CI: "1",
	NO_COLOR: "1",
};

// Close the read end of stdout before the CLI writes anything, like `| head`
// exiting early, and collect the exit code and stderr.
const runWithClosedStdout = (args: string[]): Promise<{ status: number | null; stderr: string }> =>
	new Promise((resolve) => {
		const child = spawn(process.execPath, [CLI, ...args], { env });
		child.stdout.destroy();
		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("close", (status) => resolve({ status, stderr }));
	});

describe("CLI with a closed stdout", () => {
	let dir: string;

	beforeAll(() => {
		dir = mkdtempSync(path.join(tmpdir(), "aislop-epipe-"));
		writeFileSync(path.join(dir, "index.ts"), "export const answer = 42;\n");
	});

	afterAll(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("exits cleanly without an EPIPE stack trace", async () => {
		const result = await runWithClosedStdout(["rules"]);
		expect(result.stderr).not.toContain("EPIPE");
		expect(result.status).toBe(0);
	});

	it("keeps the scan's own exit code", async () => {
		const args = ["scan", dir, "--json"];
		const expected = spawnSync(process.execPath, [CLI, ...args], { env }).status;
		const result = await runWithClosedStdout(args);
		expect(result.stderr).not.toContain("EPIPE");
		expect(result.status).toBe(expected);
	});
});
