import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

	it("treats a corrupt budget file as empty", () => {
		fs.writeFileSync(budgetPath, "not a budget");
		expect(consumeDailyBudget(budgetPath, day, 1)).toBe(true);
	});

	it("refuses to send when the budget cannot be written", () => {
		const blocked = path.join(dir, "file");
		fs.writeFileSync(blocked, "");
		expect(consumeDailyBudget(path.join(blocked, "telemetry_budget"), day, 5)).toBe(false);
	});
});
