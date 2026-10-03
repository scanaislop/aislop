import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fixBiomeFormat, runBiomeFormat } from "../src/engines/format/biome.js";
import type { EngineContext } from "../src/engines/types.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-biome-format-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("Biome formatting diagnostics", () => {
	it("emits POSIX-relative file paths", async () => {
		const sourcePath = path.join(tmpDir, "src", "unformatted.ts");
		fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
		fs.writeFileSync(path.join(tmpDir, "biome.json"), '{"formatter":{"enabled":true}}\n');
		fs.writeFileSync(sourcePath, "export const value={answer:42};\n");

		const context: EngineContext = {
			rootDirectory: tmpDir,
			languages: ["typescript"],
			frameworks: [],
			files: [sourcePath],
			installedTools: {},
			config: {
				quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
				security: { audit: false, auditTimeout: 0 },
				lint: { typecheck: false },
			},
		};

		const diagnostics = await runBiomeFormat(context);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].filePath).toBe("src/unformatted.ts");
	});

	const contextFor = (sourcePath: string): EngineContext => ({
		rootDirectory: tmpDir,
		languages: ["typescript"],
		frameworks: [],
		files: [sourcePath],
		installedTools: {},
		config: {
			quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
			security: { audit: false, auditTimeout: 0 },
			lint: { typecheck: false },
		},
	});

	const wrappedAt80 = `export const greeting = buildGreeting(
\t"a fairly long first argument",
\t"and another long second argument",
);
`;

	it("respects Biome's own default line width when biome.json does not set one", async () => {
		const sourcePath = path.join(tmpDir, "src", "wrapped.ts");
		fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
		fs.writeFileSync(path.join(tmpDir, "biome.json"), '{"formatter":{"indentStyle":"tab"}}\n');
		fs.writeFileSync(sourcePath, wrappedAt80);

		expect(await runBiomeFormat(contextFor(sourcePath))).toHaveLength(0);
		await fixBiomeFormat(contextFor(sourcePath));
		expect(fs.readFileSync(sourcePath, "utf-8")).toBe(wrappedAt80);
	});

	it("reads a biome.jsonc config", async () => {
		const sourcePath = path.join(tmpDir, "src", "unformatted.ts");
		fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
		fs.writeFileSync(path.join(tmpDir, "biome.jsonc"), '// project config\n{"formatter":{"enabled":true}}\n');
		fs.writeFileSync(sourcePath, "export const value={answer:42};\n");

		const diagnostics = await runBiomeFormat(contextFor(sourcePath));
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].filePath).toBe("src/unformatted.ts");
	});
});
