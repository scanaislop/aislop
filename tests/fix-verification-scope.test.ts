import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EngineContext } from "../src/engines/types.js";

const contexts: EngineContext[] = [];

vi.mock("../src/engines/orchestrator.js", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../src/engines/orchestrator.js")>();
	return {
		...actual,
		runEngines: (context: EngineContext, ...rest: unknown[]) => {
			contexts.push(context);
			return (actual.runEngines as (...args: unknown[]) => unknown)(context, ...rest);
		},
	};
});

const { fixCommand } = await import("../src/commands/fix.js");
const { DEFAULT_CONFIG } = await import("../src/config/defaults.js");

let tmpDir: string;

const writeFile = (relative: string, content: string): void => {
	const absolute = path.join(tmpDir, relative);
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	fs.writeFileSync(absolute, content);
};

const git = (...args: string[]): void => {
	execFileSync("git", args, { cwd: tmpDir, stdio: "ignore" });
};

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-fix-verify-scope-"));
	contexts.length = 0;
	vi.spyOn(console, "log").mockImplementation(() => undefined);
	vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("scoped fix verification", () => {
	it("passes stylesheets and include patterns to the verification scan", async () => {
		writeFile("package.json", JSON.stringify({ name: "fixture", version: "1.0.0" }));
		writeFile("src/index.ts", "export const value = 1;\n");
		writeFile("src/styles.css", "body { margin: 0; }\n");
		git("init", "-q");
		git("add", "-A");
		git("-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-qm", "init");
		writeFile("src/styles.css", ".promo-ribbon { color: red; }\n");

		await fixCommand(
			tmpDir,
			{
				...DEFAULT_CONFIG,
				engines: { ...DEFAULT_CONFIG.engines, format: false, "code-quality": false },
				security: { ...DEFAULT_CONFIG.security, audit: false },
				telemetry: { enabled: false },
			},
			{ verbose: false, changes: true, showHeader: false, printBrand: false },
		);

		const verification = contexts.at(-1);
		expect(verification?.candidateFiles?.map((file) => file.replaceAll("\\", "/"))).toEqual(
			expect.arrayContaining([expect.stringMatching(/src\/styles\.css$/)]),
		);
		expect(verification?.includePatterns).toEqual([]);
	});
});
