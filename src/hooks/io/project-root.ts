import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CONFIG_DIR, CONFIG_FILE, RULES_FILE } from "../../config/index.js";

// Files that mark a directory's .aislop/ as project state. A bare .aislop/ holding only a
// stray session.jsonl or hook.lock (left behind by older hooks) does not make a project root.
const PROJECT_MARKERS = [CONFIG_FILE, RULES_FILE, "baseline.json"];

const findGitRoot = (startDir: string): string | null => {
	let current = path.resolve(startDir);
	while (true) {
		if (fs.existsSync(path.join(current, ".git"))) return current;
		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
};

const hasProjectConfig = (dir: string): boolean =>
	PROJECT_MARKERS.some((name) => fs.existsSync(path.join(dir, CONFIG_DIR, name)));

/**
 * Hook state (lock, baseline, session files) belongs at the project root, not the agent's
 * current shell directory: the nearest directory inside the git repository whose .aislop/
 * holds project config or a baseline, else the git top-level, else `cwd`. The home
 * directory is never a project root, since aislop keeps per-user state in ~/.aislop/.
 */
export const resolveHookRoot = (cwd: string): string => {
	const start = path.resolve(cwd);
	const gitRoot = findGitRoot(start);
	const home = path.resolve(os.homedir());
	let current = start;
	while (true) {
		if (current !== home && hasProjectConfig(current)) return current;
		if (gitRoot ? current === gitRoot : current === home) break;
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return gitRoot ?? start;
};

// Agents may report edited paths relative to their own shell directory, not the project root.
export const resolveAgentPaths = (agentCwd: string, files: string[]): string[] =>
	files.map((file) => path.resolve(agentCwd, file));
