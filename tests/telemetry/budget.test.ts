import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { consumeDailyBudget, resolveBudgetPath } from "../../src/telemetry/budget.js";

describe("consumeDailyBudget", () => {
	let dir: string;
	let budgetPath: string;
	const day = new Date("2026-11-20T10:00:00Z");

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-budget-"));
		budgetPath = resolveBudgetPath(path.join(dir, "install_id"));
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("allows events until the limit and then refuses", () => {
		expect(consumeDailyBudget(budgetPath, day, 3)).toBe(true);
		expect(consumeDailyBudget(budgetPath, day, 3)).toBe(true);
		expect(consumeDailyBudget(budgetPath, day, 3)).toBe(true);
		expect(consumeDailyBudget(budgetPath, day, 3)).toBe(false);
	});

	it("starts a fresh count on the next UTC day", () => {
		consumeDailyBudget(budgetPath, day, 1);
		expect(consumeDailyBudget(budgetPath, day, 1)).toBe(false);
		expect(consumeDailyBudget(budgetPath, new Date("2026-11-21T00:00:01Z"), 1)).toBe(true);
	});

	it("shares a single budget across concurrent CLI processes", async () => {
		const moduleUrl = new URL("../../src/telemetry/budget.ts", import.meta.url).href;
		const script = `import { consumeDailyBudget } from ${JSON.stringify(moduleUrl)};
			let sent = 0;
			for (let i = 0; i < 10; i++) {
				if (consumeDailyBudget(process.argv[1], new Date("2026-11-20"), 13)) sent++;
			}
			console.log(sent);`;
		const runs = await Promise.all(
			Array.from({ length: 4 }, () =>
				promisify(execFile)(process.execPath, [
					"--experimental-strip-types",
					"--input-type=module",
					"-e",
					script,
					budgetPath,
				]),
			),
		);
		expect(runs.reduce((sum, run) => sum + Number(run.stdout), 0)).toBe(13);
	});

	it("refuses to send when the budget cannot be written", () => {
		const blocked = path.join(dir, "file");
		fs.writeFileSync(blocked, "");
		expect(consumeDailyBudget(path.join(blocked, "telemetry_budget"), day, 5)).toBe(false);
	});
});
