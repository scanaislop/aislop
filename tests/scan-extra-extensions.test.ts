import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scanCommand } from "../src/commands/scan.js";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import type { AislopConfig } from "../src/config/index.js";

// Detectors that read stylesheets or config files (unused-css, secrets) ask for
// extensions beyond the source set. A real scan hands engines a pre-filtered
// file list, so these run through scanCommand rather than the detector alone.

let tmpDir: string;

const writeFile = (relative: string, content: string): void => {
	const absolute = path.join(tmpDir, relative);
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	fs.writeFileSync(absolute, content);
};

const git = (...args: string[]): void => {
	execFileSync("git", args, { cwd: tmpDir, stdio: "ignore" });
};

const buildConfig = (overrides: Partial<AislopConfig> = {}): AislopConfig => ({
	...DEFAULT_CONFIG,
	engines: {
		format: false,
		lint: false,
		"code-quality": false,
		"ai-slop": true,
		architecture: false,
		security: true,
	},
	security: { ...DEFAULT_CONFIG.security, audit: false },
	telemetry: { enabled: false },
	...overrides,
});

const scanRules = async (config: AislopConfig, changes = false): Promise<string[]> => {
	await scanCommand(tmpDir, config, {
		changes,
		staged: false,
		verbose: false,
		json: true,
		showHeader: false,
		printBrand: false,
	});
	const calls = vi.mocked(console.log).mock.calls;
	const output = calls[calls.length - 1]?.[0];
	if (typeof output !== "string") throw new Error("Expected JSON scan output");
	const report = JSON.parse(output) as { diagnostics: { rule: string; filePath: string }[] };
	return report.diagnostics.map((d) => `${d.rule} ${d.filePath}`);
};

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-extra-ext-"));
	vi.spyOn(console, "log").mockImplementation(() => undefined);
	writeFile("package.json", JSON.stringify({ name: "fixture", version: "1.0.0" }));
});

afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("scan reaches files outside the source-extension set", () => {
	it("reports an unused class in a stylesheet on a full scan", async () => {
		writeFile("src/styles.css", ".card { padding: 4px; }\n.promo-ribbon { color: red; }\n");
		writeFile("src/index.ts", 'export const html = `<div class="card">x</div>`;\n');

		const findings = await scanRules(buildConfig());

		expect(findings).toContain("ai-slop/unused-css src/styles.css");
		expect(findings.filter((f) => f.startsWith("ai-slop/unused-css"))).toHaveLength(1);
	});

	it("reports a hardcoded secret in a YAML config file on a full scan", async () => {
		writeFile("src/index.ts", "export const ready = true;\n");
		writeFile("config/app.yml", 'password: "s3cr3tValue99"\n');

		const findings = await scanRules(buildConfig());

		expect(findings).toContain("security/hardcoded-secret config/app.yml");
	});

	it("keeps excluded stylesheets out of the scan", async () => {
		writeFile("src/index.ts", "export const ready = true;\n");
		writeFile("legacy/old.css", ".promo-ribbon { color: red; }\n");

		const findings = await scanRules(buildConfig({ exclude: ["legacy"] }));

		expect(findings.some((f) => f.startsWith("ai-slop/unused-css"))).toBe(false);
	});

	// A changed stylesheet is checked against references in the whole project, so a
	// class used by an unchanged component is not reported as unused.
	it("resolves class references project-wide when only the stylesheet changed", async () => {
		writeFile("src/index.ts", 'export const html = `<div class="card">x</div>`;\n');
		writeFile("src/styles.css", "body { margin: 0; }\n");
		git("init", "-q");
		git("add", "-A");
		git("-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-qm", "init");

		writeFile("src/styles.css", ".card { padding: 4px; }\n.promo-ribbon { color: red; }\n");
		const findings = await scanRules(buildConfig(), true);

		expect(findings.filter((f) => f.startsWith("ai-slop/unused-css"))).toEqual([
			"ai-slop/unused-css src/styles.css",
		]);
	});
});
