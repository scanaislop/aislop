import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectHallucinatedImports } from "../src/engines/ai-slop/hallucinated-imports.js";
import type { EngineContext } from "../src/engines/types.js";

let tmpDir: string;

const writeFile = (relative: string, content: string): void => {
	const absolute = path.join(tmpDir, relative);
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	fs.writeFileSync(absolute, content);
};

const buildContext = (provided: string[] = []): EngineContext => ({
	rootDirectory: tmpDir,
	languages: ["python", "typescript"],
	frameworks: [],
	installedTools: {},
	config: {
		imports: { provided },
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 0 },
		lint: { typecheck: false, expoDoctor: false },
	},
});

const flaggedImports = async (provided: string[] = []): Promise<string[]> =>
	(await detectHallucinatedImports(buildContext(provided)))
		.map((d) => d.message.match(/"([^"]+)"/)?.[1] ?? "")
		.sort();

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-py-sources-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("Python dependency sources", () => {
	it("reads requirements file variants next to pyproject.toml", async () => {
		writeFile("pyproject.toml", '[tool.ruff]\nline-length = 88\n');
		writeFile("requirements_dev.txt", "voluptuous==0.15\n");
		writeFile("requirements-test.txt", "pytest\n");
		writeFile("dev-requirements.txt", "PyYAML>=6\n");
		writeFile(
			"app/main.py",
			["import voluptuous", "import pytest", "import yaml", "import ghostlib"].join("\n"),
		);

		expect(await flaggedImports()).toEqual(["ghostlib"]);
	});

	it("follows -r includes and reads a requirements/ directory", async () => {
		writeFile("requirements/base.txt", "requests\n");
		writeFile("requirements/dev.txt", "-r base.txt\nblack\n");
		writeFile("requirements_lint.txt", "--requirement extra/lint.txt\n");
		writeFile("extra/lint.txt", "ruff\n");
		writeFile("app/main.py", ["import requests", "import black", "import ruff", "import ghostlib"].join("\n"));

		expect(await flaggedImports()).toEqual(["ghostlib"]);
	});

	it("does not follow includes outside the project", async () => {
		const outside = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-py-outside-"));
		try {
			fs.writeFileSync(path.join(outside, "reqs.txt"), "ghostlib\n");
			writeFile("requirements.txt", `-r ${path.join(outside, "reqs.txt")}\n`);
			writeFile("app/main.py", "import ghostlib\n");

			expect(await flaggedImports()).toEqual(["ghostlib"]);
		} finally {
			fs.rmSync(outside, { recursive: true, force: true });
		}
	});

	it("reads PEP 723 inline script dependencies for that script only", async () => {
		writeFile("pyproject.toml", '[project]\nname = "app"\ndependencies = []\n');
		writeFile(
			"tools/shot.py",
			[
				"# /// script",
				'# requires-python = ">=3.11"',
				"# dependencies = [",
				'#   "playwright>=1.40",',
				'#   "rich",',
				"# ]",
				"# ///",
				"import playwright",
				"import rich",
			].join("\n"),
		);
		writeFile("app/main.py", "import playwright\n");

		const diagnostics = await detectHallucinatedImports(buildContext());
		expect(diagnostics.map((d) => d.filePath)).toEqual(["app/main.py"]);
	});

	it("checks a standalone PEP 723 script when the project has no manifest", async () => {
		writeFile(
			"shot.py",
			["# /// script", '# dependencies = ["playwright"]', "# ///", "import playwright", "import ghostlib"].join(
				"\n",
			),
		);
		writeFile("plain.py", "import ghostlib\n");

		const diagnostics = await detectHallucinatedImports(buildContext());
		expect(diagnostics.map((d) => [d.filePath, d.message.match(/"([^"]+)"/)?.[1]])).toEqual([
			["shot.py", "ghostlib"],
		]);
	});

	it("does not treat constraint file entries as declared dependencies", async () => {
		writeFile("requirements.txt", "-c constraints.txt\nrequests\n");
		writeFile("constraints.txt", "ghostlib==1.0\n");
		writeFile("app/main.py", ["import requests", "import ghostlib"].join("\n"));

		expect(await flaggedImports()).toEqual(["ghostlib"]);
	});

	it("skips modules listed in imports.provided, including submodules", async () => {
		writeFile("pyproject.toml", '[project]\nname = "integration"\ndependencies = []\n');
		writeFile(
			"custom_components/lock/__init__.py",
			["from homeassistant.core import HomeAssistant", "import fpylll", "import ghostlib"].join(
				"\n",
			),
		);

		expect(await flaggedImports(["homeassistant", "fpylll"])).toEqual(["ghostlib"]);
	});

	it("does not treat a name prefix as a provided module", async () => {
		writeFile("pyproject.toml", '[project]\nname = "integration"\ndependencies = []\n');
		writeFile("app/main.py", "import homeassistantx\n");

		expect(await flaggedImports(["homeassistant"])).toEqual(["homeassistantx"]);
	});

	it("skips provided JavaScript modules and their subpaths", async () => {
		writeFile("package.json", JSON.stringify({ name: "ext", dependencies: {} }));
		writeFile(
			"src/extension.ts",
			['import * as vscode from "vscode";', 'import x from "vscode/sub";', 'import g from "ghost-pkg";'].join(
				"\n",
			),
		);

		expect(await flaggedImports(["vscode"])).toEqual(["ghost-pkg"]);
	});
});
