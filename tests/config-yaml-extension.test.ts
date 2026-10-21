import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig, RULES_FILE, resolveConfigFile } from "../src/config/index.js";
import { AISLOP_MD_BODY } from "../src/hooks/assets.js";

let tmpDir: string;
let configDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-yaml-ext-"));
	configDir = path.join(tmpDir, ".aislop");
	fs.mkdirSync(configDir);
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe(".yaml config filenames", () => {
	it("loads .aislop/config.yaml when there is no config.yml", () => {
		fs.writeFileSync(path.join(configDir, "config.yaml"), "exclude:\n  - generated\n");

		expect(loadConfig(tmpDir).exclude).toEqual(["generated"]);
	});

	it("prefers config.yml when both spellings exist", () => {
		fs.writeFileSync(path.join(configDir, "config.yaml"), "exclude:\n  - from-yaml\n");
		fs.writeFileSync(path.join(configDir, "config.yml"), "exclude:\n  - from-yml\n");

		expect(loadConfig(tmpDir).exclude).toEqual(["from-yml"]);
	});

	it("resolves rules.yaml when there is no rules.yml", () => {
		fs.writeFileSync(path.join(configDir, "rules.yaml"), "rules: []\n");

		expect(resolveConfigFile(configDir, RULES_FILE)).toBe(path.join(configDir, "rules.yaml"));
	});

	it("falls back to the .yml path when neither file exists", () => {
		expect(resolveConfigFile(configDir, RULES_FILE)).toBe(path.join(configDir, "rules.yml"));
	});

	it("points agents at the .yml filenames", () => {
		expect(AISLOP_MD_BODY).toContain(".aislop/config.yml");
		expect(AISLOP_MD_BODY).toContain(".aislop/rules.yml");
		expect(AISLOP_MD_BODY).not.toContain(".yaml");
	});
});
