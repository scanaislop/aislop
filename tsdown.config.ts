import fs from "node:fs";
import { defineConfig } from "tsdown";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
	version: string;
};

const bundledDeps = [
	"@clack/prompts",
	"@modelcontextprotocol/sdk",
	"adm-zip",
	"commander",
	"expo-doctor",
	"ink",
	"ink-select-input",
	"ink-testing-library",
	"picocolors",
	"picomatch",
	"react",
	"smol-toml",
	"tar",
	"wcwidth",
	"yaml",
	"zod",
	"zod-to-json-schema",
];

export default defineConfig([
	{
		entry: {
			cli: "./src/cli.ts",
		},
		deps: {
			alwaysBundle: bundledDeps.map((d) => new RegExp(`^${d}`)),
			neverBundle: ["oxlint", "knip", "knip/session", "@biomejs/biome", "typescript"],
			onlyBundle: false,
		},
		dts: true,
		target: "node18",
		platform: "node",
		env: {
			VERSION: process.env.VERSION ?? packageJson.version,
		},
		fixedExtension: false,
		banner: "#!/usr/bin/env node",
	},
	{
		entry: {
			index: "./src/index.ts",
			"adapters/astro": "./src/framework-adapters/astro.ts",
			"adapters/expo": "./src/framework-adapters/expo.ts",
			"adapters/nuxt": "./src/framework-adapters/nuxt.ts",
			"adapters/sveltekit": "./src/framework-adapters/sveltekit.ts",
			"adapters/vite": "./src/framework-adapters/vite.ts",
		},
		deps: {
			neverBundle: ["oxlint", "knip", "knip/session", "@biomejs/biome", "typescript"],
		},
		dts: true,
		target: "node18",
		platform: "node",
		env: {
			VERSION: process.env.VERSION ?? packageJson.version,
		},
		fixedExtension: false,
	},
	{
		entry: {
			mcp: "./src/mcp.ts",
		},
		deps: {
			alwaysBundle: bundledDeps.map((d) => new RegExp(`^${d}`)),
			neverBundle: ["oxlint", "knip", "knip/session", "@biomejs/biome", "typescript"],
			onlyBundle: false,
		},
		dts: false,
		target: "node18",
		platform: "node",
		env: {
			VERSION: process.env.VERSION ?? packageJson.version,
		},
		fixedExtension: false,
		banner: "#!/usr/bin/env node",
	},
]);
