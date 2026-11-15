import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectHardcodedConfigLiterals } from "../src/engines/ai-slop/hardcoded-config.js";
import type { EngineContext } from "../src/engines/types.js";

let root: string;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-homebrew-url-"));
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

const scan = async (filename: string, content: string) => {
	const file = path.join(root, filename);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
	const context: EngineContext = {
		rootDirectory: root,
		languages: ["ruby"],
		frameworks: [],
		files: [file],
		installedTools: {},
		config: {
			quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
			security: { audit: false, auditTimeout: 0 },
		},
	};
	return detectHardcodedConfigLiterals(context);
};

describe("Homebrew download URLs", () => {
	it.each(["Formula/tool.rb", "Formula/t/tool.rb", "HomebrewFormula/tool.rb", "tool.rb"])(
		"accepts formula download metadata in %s",
		async (filename) => {
			const diagnostics = await scan(
				filename,
				[
					"class Tool < Formula",
					'  url "https://registry.npmjs.org/tool/-/tool-1.0.0.tgz"',
					'  mirror("https://downloads.acme.io/api/releases/tool-1.0.0.tgz")',
					"end",
				].join("\n"),
			);
			expect(diagnostics).toEqual([]);
		},
	);

	it("accepts cask download metadata with version interpolation", async () => {
		const diagnostics = await scan(
			"Casks/v/viewer.rb",
			[
				'cask "viewer" do',
				'  version "1.0.0"',
				'  url "https://downloads.acme.io/viewer-#{version}.dmg"',
				"end",
			].join("\n"),
		);
		expect(diagnostics).toEqual([]);
	});

	it("recognizes a formula header after comments and requires", async () => {
		const diagnostics = await scan(
			"Formula/tool.rb",
			[
				"# frozen_string_literal: true",
				'require "language/node"',
				"require_relative('download_strategy')",
				"",
				"class Tool < ::Formula",
				"  url 'https://registry.npmjs.org/tool/-/tool-1.0.0.tgz'",
				"end",
			].join("\r\n"),
		);
		expect(diagnostics).toEqual([]);
	});

	it("continues reporting application URLs and IDs in formula files", async () => {
		const diagnostics = await scan(
			"Formula/tool.rb",
			[
				"class Tool < Formula",
				'  url "https://registry.npmjs.org/tool/-/tool-1.0.0.tgz"',
				'  API_ENDPOINT = "https://api.acme.io/v1"',
				'  url = "https://staging.acme.io/v1"',
				'  client.url("https://app.acme.io/v1")',
				'  PRICE_ID = "price_123456789abcdef"',
				"end",
			].join("\n"),
		);
		expect(diagnostics.map(({ rule, line }) => ({ rule, line }))).toEqual([
			{ rule: "ai-slop/hardcoded-url", line: 3 },
			{ rule: "ai-slop/hardcoded-url", line: 4 },
			{ rule: "ai-slop/hardcoded-url", line: 5 },
			{ rule: "ai-slop/hardcoded-id", line: 6 },
		]);
	});

	it("only exempts the download argument, not other URLs on the same line", async () => {
		const diagnostics = await scan(
			"Formula/tool.rb",
			[
				"class Tool < Formula",
				'  url "https://downloads.acme.io/tool.tgz", headers: { "Origin" => "https://app.acme.io" }',
				"end",
			].join("\n"),
		);
		expect(diagnostics).toEqual([
			expect.objectContaining({ rule: "ai-slop/hardcoded-url", line: 2 }),
		]);
	});

	it("does not exempt Ruby command strings", async () => {
		const diagnostics = await scan(
			"Formula/tool.rb",
			["class Tool < Formula", "  url `https://app.acme.io/v1`", "end"].join("\n"),
		);
		expect(diagnostics).toEqual([
			expect.objectContaining({ rule: "ai-slop/hardcoded-url", line: 2 }),
		]);
	});

	it.each([
		["client.rb", 'url "https://api.acme.io/v1"'],
		["Formula/client.rb", 'url "https://api.acme.io/v1"'],
		["client.rb", '# class Tool < Formula\nurl "https://api.acme.io/v1"'],
		["client.rb", 'description = "class Tool < Formula"\nurl "https://api.acme.io/v1"'],
		["client.rb", 'description = "\nclass Tool < Formula\n"\nurl "https://api.acme.io/v1"'],
		["client.rb", 'description = \'cask "viewer" do\'\nurl "https://api.acme.io/v1"'],
		["client.rb", 'description = \'\ncask "viewer" do\n\'\nurl "https://api.acme.io/v1"'],
		["client.rb", 'class Client < Formula::Parser\n  url "https://api.acme.io/v1"\nend'],
		["client.ts", 'class Tool extends Formula {}\nconst url = "https://api.acme.io/v1";'],
	])("still scans non-recipe context %s: %s", async (filename, content) => {
		expect(await scan(filename, content)).toEqual([
			expect.objectContaining({ rule: "ai-slop/hardcoded-url" }),
		]);
	});
});
