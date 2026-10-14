import fs from "node:fs";
import path from "node:path";
import { findConfigDir } from "../../config/index.js";

const findGitRoot = (startDir: string): string | null => {
	let current = path.resolve(startDir);
	while (true) {
		if (fs.existsSync(path.join(current, ".git"))) return current;
		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
};

/**
 * Hook state (lock, baseline, session files) belongs at the project root, not the agent's
 * current shell directory: nearest dir holding `.aislop/`, else the git top-level, else `cwd`.
 */
export const resolveHookRoot = (cwd: string): string => {
	const configDir = findConfigDir(cwd);
	if (configDir) return path.dirname(configDir);
	return findGitRoot(cwd) ?? path.resolve(cwd);
};
