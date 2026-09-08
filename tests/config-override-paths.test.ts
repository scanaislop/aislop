import path from "node:path";
import { describe, expect, it } from "vitest";
import { overrideRelativePath, resolveFilePolicy } from "../src/config/overrides.js";
import { parseConfig } from "../src/config/schema.js";

describe("file policy matching", () => {
	it.each([
		["/project", "/project/src/users.controller.ts"],
		["/project", "src\\users.controller.ts"],
		["C:\\project", "C:\\project\\src\\users.controller.ts"],
		["C:\\project", "src\\users.controller.ts"],
		["\\\\server\\repo", "\\\\server\\repo\\src\\users.controller.ts"],
		["/project", "./src/users.controller.ts"],
	])("normalizes project-relative matches for %s and %s", (root, file) => {
		const config = parseConfig({
			overrides: [{ files: ["src/*.controller.ts"], quality: { maxFileLoc: 700 } }],
		});
		const relative = overrideRelativePath(root, file);
		expect(resolveFilePolicy(config, relative).quality.maxFileLoc).toBe(700);
	});

	it("merges only supplied fields and lets later matching entries win", () => {
		const config = parseConfig({
			quality: { maxFunctionLoc: 42, maxNesting: 3 },
			rules: { "ai-slop/narrative-comment": "error" },
			overrides: [
				{ files: ["**/*.ts"], quality: { maxFileLoc: 600, maxParams: 4 } },
				{
					files: ["src/**"],
					quality: { maxFileLoc: 700 },
					rules: { "ai-slop/narrative-comment": "off" },
				},
				{ files: ["other/**"], quality: { maxFileLoc: 10 } },
			],
		});
		const policy = resolveFilePolicy(config, "src/users.ts");
		expect(policy).toEqual({
			quality: { maxFunctionLoc: 42, maxFileLoc: 700, maxNesting: 3, maxParams: 4 },
			rules: { "ai-slop/narrative-comment": "off" },
		});
	});

	it.each(["../outside.ts", "/outside.ts", "other/file.js"])(
		"retains base policy for unmatched path %s",
		(file) => {
			const config = parseConfig({
				overrides: [{ files: ["**/*.ts"], quality: { maxParams: 2 } }],
			});
			expect(resolveFilePolicy(config, file).quality).toBe(config.quality);
		},
	);

	it("retains no-override behavior and does not mutate base config", () => {
		const config = parseConfig({});
		const before = structuredClone(config);
		expect(resolveFilePolicy(config, path.posix.join("src", "a.ts")).quality).toBe(config.quality);
		expect(config).toEqual(before);
	});

	it("supports negative patterns within one entry and dot directories", () => {
		const config = parseConfig({
			overrides: [{ files: ["**/*.ts", "!**/*.service.ts"], quality: { maxParams: 2 } }],
		});
		expect(resolveFilePolicy(config, ".generated/a.ts").quality.maxParams).toBe(2);
		expect(resolveFilePolicy(config, "a.service.ts").quality.maxParams).toBe(6);
	});
});
