import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import YAML from "yaml";
import { z } from "zod/v4";

const cli = path.resolve("dist/cli.js");
let root: string;
const resultSchema = z.object({
	score: z.number(),
	diagnostics: z.array(z.object({ filePath: z.string(), rule: z.string(), severity: z.string() })),
});
const run = (command: string) =>
	spawnSync(process.execPath, [cli, command, root, "--json"], {
		encoding: "utf8",
		env: { ...process.env, CI: "1", AISLOP_NO_TELEMETRY: "1", AISLOP_NO_UPDATE_NOTIFIER: "1" },
	});

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-override-cli-"));
	fs.mkdirSync(path.join(root, ".aislop"));
	fs.writeFileSync(
		path.join(root, "package.json"),
		JSON.stringify({ name: "override-fixture", private: true }),
	);
	for (const name of ["users.controller.ts", "users.service.ts", "old.generated.ts"]) {
		fs.writeFileSync(
			path.join(root, name),
			Array.from({ length: 20 }, (_, i) => `export const v${i} = ${i};`).join("\n"),
		);
	}
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const writeConfig = (overrides: unknown[] = []) =>
	fs.writeFileSync(
		path.join(root, ".aislop", "config.yml"),
		YAML.stringify({
			engines: {
				format: false,
				lint: false,
				"code-quality": true,
				"ai-slop": false,
				security: false,
				architecture: false,
			},
			quality: { maxFileLoc: 10 },
			ci: { failBelow: 0 },
			rules: { "complexity/file-too-large": "off" },
			overrides,
		}),
	);

describe("CLI override policy", () => {
	it.each(["scan", "ci"])("reports only the service error through %s", (command) => {
		writeConfig([
			{ files: ["**/*.ts"], rules: { "complexity/file-too-large": "warning" } },
			{ files: ["**/*.controller.ts"], quality: { maxFileLoc: 30 } },
			{ files: ["**/*.service.ts"], rules: { "complexity/file-too-large": "error" } },
			{ files: ["**/*.generated.ts"], rules: { "complexity/file-too-large": "off" } },
		]);
		const result = run(command);
		const output = resultSchema.parse(JSON.parse(result.stdout));
		expect(result.status).toBe(1);
		expect(output.diagnostics.filter((d) => d.rule === "complexity/file-too-large")).toEqual([
			{ filePath: "users.service.ts", rule: "complexity/file-too-large", severity: "error" },
		]);
	});

	it("retains globally disabled rules without overrides", () => {
		writeConfig();
		const result = run("scan");
		const output = resultSchema.parse(JSON.parse(result.stdout));
		expect(result.status).toBe(0);
		expect(output.diagnostics.some((d) => d.rule === "complexity/file-too-large")).toBe(false);
	});
});
