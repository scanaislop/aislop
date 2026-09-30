import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AislopConfigSchema, parseConfig } from "../src/config/schema.js";
import { runEngines } from "../src/engines/orchestrator.js";

const roots: string[] = [];
afterEach(() => {
	for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe("ordered file overrides", () => {
	it("preserves partial quality fields when parsing an override", () => {
		const entry = { files: ["**/*.controller.ts"], quality: { maxFileLoc: 700 } };
		const config = AislopConfigSchema.parse({ overrides: [entry] });
		expect(config).toHaveProperty("overrides", [entry]);
	});

	it.each([
		{ files: [] },
		{ quality: { maxFileLoc: 700 } },
		{ files: ["**/*.ts"], quality: { maxParams: 0 } },
		{ files: ["**/*.ts"], rules: { "ai-slop/trivial-comment": "info" } },
	])("rejects invalid override %j", (entry) => {
		const result = AislopConfigSchema.safeParse({ overrides: [entry] });
		expect(result.success).toBe(false);
	});

	it("applies controller limits and later rule re-enablement in one scan", async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-overrides-"));
		roots.push(root);
		const names = ["users.controller.ts", "users.service.ts", "old.generated.ts"];
		const files = names.map((name) => path.join(root, name));
		for (const file of files) {
			fs.writeFileSync(
				file,
				Array.from({ length: 20 }, (_, i) => `export const v${i} = ${i};`).join("\n"),
			);
		}
		const config = parseConfig({
			quality: { maxFileLoc: 10 },
			rules: { "complexity/file-too-large": "off" },
			overrides: [
				{ files: ["**/*.ts"], rules: { "complexity/file-too-large": "warning" } },
				{ files: ["**/*.controller.ts"], quality: { maxFileLoc: 30 } },
				{ files: ["**/*.service.ts"], rules: { "complexity/file-too-large": "error" } },
				{ files: ["**/*.generated.ts"], rules: { "complexity/file-too-large": "off" } },
			],
		});
		const results = await runEngines(
			{
				rootDirectory: root,
				languages: ["typescript"],
				frameworks: [],
				files,
				installedTools: {},
				config: { ...config, allowProjectLocalTools: false },
			},
			{
				format: false,
				lint: false,
				"code-quality": true,
				"ai-slop": false,
				security: false,
				architecture: false,
			},
		);
		const findings = results
			.flatMap((result) => result.diagnostics)
			.filter((d) => d.rule === "complexity/file-too-large");
		expect(findings.map(({ filePath, severity }) => ({ filePath, severity }))).toEqual([
			{ filePath: "users.service.ts", severity: "error" },
		]);
	});
});
