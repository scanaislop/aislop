import fs from "node:fs";
import path from "node:path";

const FILE_BASENAME = "telemetry_budget";

export const MAX_EVENTS_PER_DAY = 200;

export const resolveBudgetPath = (installIdPath: string): string =>
	path.join(path.dirname(installIdPath), FILE_BASENAME);

const readUsed = (budgetPath: string, day: string): number => {
	try {
		const [storedDay, storedCount] = fs.readFileSync(budgetPath, "utf-8").trim().split(" ");
		const count = Number.parseInt(storedCount ?? "", 10);
		return storedDay === day && Number.isFinite(count) ? count : 0;
	} catch {
		return 0;
	}
};

export const consumeDailyBudget = (
	budgetPath: string,
	now: Date = new Date(),
	limit: number = MAX_EVENTS_PER_DAY,
): boolean => {
	const day = now.toISOString().slice(0, 10);
	const used = readUsed(budgetPath, day);
	if (used >= limit) return false;
	try {
		fs.mkdirSync(path.dirname(budgetPath), { recursive: true });
		fs.writeFileSync(budgetPath, `${day} ${used + 1}\n`, { mode: 0o600 });
		return true;
	} catch {
		return false;
	}
};
