import fs from "node:fs";
import path from "node:path";

const FILE_BASENAME = "telemetry_budget";

export const MAX_EVENTS_PER_DAY = 200;

export const resolveBudgetPath = (installIdPath: string): string =>
	path.join(path.dirname(installIdPath), FILE_BASENAME);

export const consumeDailyBudget = (
	budgetPath: string,
	now: Date = new Date(),
	limit: number = MAX_EVENTS_PER_DAY,
): boolean => {
	const day = now.toISOString().slice(0, 10);
	const directory = `${budgetPath}.${day}`;
	try {
		if (fs.mkdirSync(directory, { recursive: true, mode: 0o700 })) {
			const parent = path.dirname(budgetPath);
			const prefix = `${path.basename(budgetPath)}.`;
			for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
				const date = entry.name.slice(prefix.length);
				if (
					entry.isDirectory() &&
					entry.name.startsWith(prefix) &&
					/^\d{4}-\d{2}-\d{2}$/.test(date) &&
					date < day
				) {
					fs.rmSync(path.join(parent, entry.name), { recursive: true, force: true });
				}
			}
		}
		const used = fs.readdirSync(directory).length;
		for (let slot = used; slot < limit; slot++) {
			try {
				fs.writeFileSync(path.join(directory, String(slot)), "", { flag: "wx", mode: 0o600 });
				return true;
			} catch (error) {
				if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
			}
		}
	} catch {
		return false;
	}
	return false;
};
