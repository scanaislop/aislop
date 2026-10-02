import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import { formatEngine } from "../../src/engines/format/index.js";
import { lintEngine } from "../../src/engines/lint/index.js";
import type { EngineContext } from "../../src/engines/types.js";
import type { Language } from "../../src/utils/discover.js";

const ctx = (languages: Language[], installedTools: Record<string, boolean> = {}): EngineContext => ({
	rootDirectory: fs.mkdtempSync(path.join(os.tmpdir(), "aislop-missing-tools-")),
	languages,
	frameworks: [],
	files: [],
	installedTools,
	config: {
		quality: DEFAULT_CONFIG.quality,
		security: DEFAULT_CONFIG.security,
		lint: DEFAULT_CONFIG.lint,
	},
});

describe("format/lint engines report missing tools", () => {
	it("names ruff when a Python-only scan skips format and lint", async () => {
		const format = await formatEngine.run(ctx(["python"]));
		const lint = await lintEngine.run(ctx(["python"]));
		expect(format).toMatchObject({ skipped: true, missingTools: ["ruff"] });
		expect(format.skipReason).toBe("missing tools: ruff");
		expect(lint).toMatchObject({ skipped: true, missingTools: ["ruff"] });
		expect(lint.skipReason).toBe("missing tools: ruff");
	});

	it("reports the missing tool when other languages still ran", async () => {
		const format = await formatEngine.run(ctx(["typescript", "python"]));
		const lint = await lintEngine.run(ctx(["typescript", "go"]));
		expect(format).toMatchObject({ skipped: false, missingTools: ["ruff"] });
		expect(lint).toMatchObject({ skipped: false, missingTools: ["golangci-lint"] });
	});

	it("reports no missing tools when nothing is missing", async () => {
		const format = await formatEngine.run(ctx(["typescript"]));
		expect(format.missingTools).toBeUndefined();
	});

	it("keeps the generic reason when no language has a tool to run", async () => {
		const format = await formatEngine.run(ctx(["csharp"]));
		expect(format.skipped).toBe(true);
		expect(format.missingTools).toBeUndefined();
		expect(format.skipReason).toMatch(/no formatter/);
	});
});
