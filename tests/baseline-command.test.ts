import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baselinePruneCommand, baselineWriteCommand } from "../src/commands/baseline.js";
import { ciCommand } from "../src/commands/ci.js";
import { parseConfig } from "../src/config/schema.js";

let root: string;

const SWALLOWED = "export function run(a: () => void) {\n\ttry {\n\t\ta();\n\t} catch (e) {}\n}\n";

const config = (baseline: string | null = ".aislop/baseline.json") =>
	parseConfig({
		engines: {
			format: false,
			lint: false,
			"code-quality": false,
			"ai-slop": true,
			architecture: false,
			security: false,
		},
		telemetry: { enabled: false },
		ci: { failBelow: 0, ...(baseline ? { baseline } : {}) },
	});

const writeSource = (relative: string, content: string): void => {
	const absolute = path.join(root, relative);
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	fs.writeFileSync(absolute, content);
};

const runCi = async (cfg = config()) => {
	const out: string[] = [];
	const spy = vi.spyOn(console, "log").mockImplementation((value: unknown) => {
		out.push(String(value));
	});
	const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
	try {
		const { exitCode } = await ciCommand(root, cfg);
		return { exitCode, json: JSON.parse(out.join("\n")) };
	} finally {
		spy.mockRestore();
		stderr.mockRestore();
	}
};

const quietly = async <T>(run: () => Promise<T>): Promise<T> => {
	const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
	try {
		return await run();
	} finally {
		spy.mockRestore();
	}
};

const baselineFile = () => path.join(root, ".aislop", "baseline.json");

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-baseline-cmd-"));
	writeSource("package.json", '{"name":"fixture","version":"1.0.0"}\n');
	writeSource("src/app.ts", SWALLOWED);
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

describe("baseline commands and ci", () => {
	it("fails ci on findings when the configured baseline file is missing", async () => {
		const { exitCode, json } = await runCi();
		expect(exitCode).toBe(1);
		expect(json.baseline).toMatchObject({ status: "missing", accepted: 0 });
		expect(json.baseline.new).toBeGreaterThan(0);
	});

	it("passes ci after baseline write and marks accepted diagnostics", async () => {
		expect((await quietly(() => baselineWriteCommand(root, config()))).exitCode).toBe(0);
		expect(fs.existsSync(baselineFile())).toBe(true);

		const { exitCode, json } = await runCi();
		expect(exitCode).toBe(0);
		expect(json.baseline).toMatchObject({ status: "ok", new: 0, stale: 0 });
		expect(json.diagnostics.every((d: { baselined?: boolean }) => d.baselined)).toBe(true);
		expect(json.score).toBeLessThan(100);
	});

	it("fails ci on a new finding and reports stale entries after a fix", async () => {
		await quietly(() => baselineWriteCommand(root, config()));
		writeSource("src/other.ts", SWALLOWED.replace("run", "other"));
		const withNew = await runCi();
		expect(withNew.exitCode).toBe(1);
		expect(withNew.json.baseline.new).toBeGreaterThan(0);

		fs.rmSync(path.join(root, "src", "other.ts"));
		writeSource("src/app.ts", "export const run = (a: () => void) => a();\n");
		const fixed = await runCi();
		expect(fixed.exitCode).toBe(0);
		expect(fixed.json.baseline.stale).toBeGreaterThan(0);
	});

	it("prune removes entries that no longer occur and never adds new ones", async () => {
		await quietly(() => baselineWriteCommand(root, config()));
		writeSource("src/app.ts", "export const run = (a: () => void) => a();\n");
		writeSource("src/other.ts", SWALLOWED.replace("run", "other"));

		expect((await quietly(() => baselinePruneCommand(root, config()))).exitCode).toBe(0);
		const pruned = JSON.parse(fs.readFileSync(baselineFile(), "utf-8"));
		expect(pruned.entries).toEqual([]);
	});

	it("prune fails clearly when there is no baseline yet", async () => {
		const result = await quietly(() => baselinePruneCommand(root, config()));
		expect(result.exitCode).toBe(1);
	});

	it("leaves ci unchanged when no baseline is configured", async () => {
		const { json } = await runCi(config(null));
		expect(json.baseline).toBeUndefined();
		expect(json.diagnostics.some((d: { baselined?: boolean }) => d.baselined)).toBe(false);
	});
});
