import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EngineResult } from "../src/engines/types.js";

const results: EngineResult[] = [];

vi.mock("../src/commands/scan-pipeline.js", () => ({
	prepareScan: vi.fn(async () => ({})),
	runScanEngines: vi.fn(async () => ({ results, suppressedCount: 0 })),
}));

const { baselineWriteCommand } = await import("../src/commands/baseline.js");
const { parseConfig } = await import("../src/config/schema.js");

let root: string;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-baseline-incomplete-"));
	fs.writeFileSync(path.join(root, "package.json"), '{"name":"fixture"}\n');
	results.length = 0;
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

const engineResult = (overrides: Partial<EngineResult>): EngineResult => ({
	engine: "lint",
	diagnostics: [],
	elapsed: 0,
	skipped: false,
	...overrides,
});

const write = async () => {
	const errors: string[] = [];
	const spy = vi.spyOn(console, "error").mockImplementation((value: unknown) => {
		errors.push(String(value));
	});
	const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
	try {
		const { exitCode } = await baselineWriteCommand(root, parseConfig({ telemetry: { enabled: false } }));
		return { exitCode, errors: errors.join("\n") };
	} finally {
		spy.mockRestore();
		out.mockRestore();
	}
};

const baselineFile = () => path.join(root, ".aislop", "ci-baseline.json");

describe("baseline write on an incomplete scan", () => {
	it("refuses when an engine reports missing tools", async () => {
		results.push(engineResult({ engine: "format", skipped: true, missingTools: ["ruff"] }));

		const { exitCode } = await write();
		expect(exitCode).toBe(1);
		expect(fs.existsSync(baselineFile())).toBe(false);
	});

	it("refuses when an engine failed", async () => {
		results.push(engineResult({ engine: "lint", failed: true }));

		expect((await write()).exitCode).toBe(1);
		expect(fs.existsSync(baselineFile())).toBe(false);
	});

	it("writes when engines were skipped only because nothing applied", async () => {
		results.push(engineResult({ engine: "format", skipped: true, skipReason: "no formatter for the detected languages" }));

		expect((await write()).exitCode).toBe(0);
		expect(fs.existsSync(baselineFile())).toBe(true);
	});
});
