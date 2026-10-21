import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG } from "./defaults.js";
import { loadConfigChain } from "./extends.js";
import { type AislopConfig, parseConfig } from "./schema.js";

export const CONFIG_DIR = ".aislop";
export const CONFIG_FILE = "config.yml";
export const RULES_FILE = "rules.yml";

// Both the .yml and .yaml spellings are read; the .yml file wins when both exist.
export const resolveConfigFile = (configDir: string, fileName: string): string => {
	const preferred = path.join(configDir, fileName);
	if (fs.existsSync(preferred)) return preferred;
	const alternate = path.join(configDir, fileName.replace(/\.yml$/, ".yaml"));
	return fs.existsSync(alternate) ? alternate : preferred;
};

export const findConfigDir = (startDir: string, stopAt?: string): string | null => {
	let current = path.resolve(startDir);
	const boundary = stopAt ? path.resolve(stopAt) : null;
	while (true) {
		const candidate = path.join(current, CONFIG_DIR);
		if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
			return candidate;
		}
		if (boundary && current === boundary) break;
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
};

export const loadConfig = (directory: string): AislopConfig => {
	const configDir = findConfigDir(directory);
	if (!configDir) return DEFAULT_CONFIG;

	const configPath = resolveConfigFile(configDir, CONFIG_FILE);
	if (!fs.existsSync(configPath)) return DEFAULT_CONFIG;

	try {
		const merged = loadConfigChain(configPath);
		return parseConfig(merged);
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		process.stderr.write(
			`  ⚠ Failed to parse ${configPath}: ${msg}\n  ⚠ Using default configuration.\n`,
		);
		return DEFAULT_CONFIG;
	}
};

export type { AislopConfig } from "./schema.js";
