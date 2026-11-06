import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { explainScopeCommand, renderScopeExplanation } from "../src/commands/explain-scope.js";
import { collectScanFileScope } from "../src/commands/scan-file-scope.js";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { listUnsupportedCoverageFiles } from "../src/utils/discovery-coverage.js";
import {
	buildScopeExplanation,
	classifyScanScope,
	type ExclusionReason,
	exclusionReasonForCandidate,
} from "../src/utils/scope-explanation.js";
import { redactHomeDirectory, redactHomeInText } from "../src/utils/scope-path.js";
import {
	EXCLUDED_SOURCE_DIRECTORIES,
	TEST_EXCLUDED_DIRECTORIES,
} from "../src/utils/source-file-policy.js";
import {
	compileExcludeMatcher,
	compileIncludeMatcher,
	filterProjectDeclarationFiles,
	listProjectFiles,
	pathSelectionReason,
} from "../src/utils/source-file-selection.js";

const SECRET = "scope-secret-sentinel-value";

const git = (cwd: string, args: string[]) => {
	execFileSync("git", args, { cwd, stdio: "ignore" });
};

const createFile = (
	root: string,
	relativePath: string,
	content = "export const value = true;\n",
) => {
	const absolutePath = path.join(root, relativePath);
	fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
	fs.writeFileSync(absolutePath, content, "utf-8");
};

const relativePaths = (root: string, files: readonly string[]): string[] =>
	files.map((file) => path.relative(root, file).split(path.sep).join("/")).sort();

const captureStdout = (run: () => void): string => {
	let output = "";
	const write = process.stdout.write;
	process.stdout.write = ((chunk: string | Uint8Array) => {
		output += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
		return true;
	}) as typeof process.stdout.write;
	try {
		run();
	} finally {
		process.stdout.write = write;
	}
	return output;
};

const openPolicy = {
	ignored: false,
	includePatterns: [] as string[],
	matchesAislopIgnore: () => false,
	matchesInclude: () => false,
	matchesUserExclude: compileExcludeMatcher(["legacy"]),
};

describe("scope path redaction", () => {
	it("redacts Linux and Windows home directories", () => {
		expect(redactHomeDirectory("/home/alice/proj", "/home/alice")).toBe("~/proj");
		expect(redactHomeDirectory("/Users/bob/work/src/app.ts", "/Users/bob")).toBe(
			"~/work/src/app.ts",
		);
		expect(redactHomeDirectory(String.raw`C:\Users\alice\proj`, String.raw`C:\Users\alice`)).toBe(
			"~/proj",
		);
		expect(redactHomeDirectory(String.raw`D:\Users\bob\app\src\main.ts`)).toBe("~/app/src/main.ts");
		expect(redactHomeInText("Path does not exist: /home/alice/missing")).toBe(
			"Path does not exist: ~/missing",
		);
		expect(redactHomeInText(String.raw`Not a directory: C:\Users\alice\repo`)).not.toContain(
			String.raw`C:\Users\alice`,
		);
	});
});

describe("scope classification on Linux-style and Windows-style paths", () => {
	const cases: Array<[string, string, ExclusionReason | null]> = [
		["vendor/lib.go", String.raw`vendor\lib.go`, "builtin-directory"],
		["src/app.min.js", String.raw`src\app.min.js`, "generated"],
		["src/app.test.ts", String.raw`src\app.test.ts`, null],
		["legacy/old.ts", String.raw`legacy\old.ts`, "user-exclude"],
		["src/hidden.ts", String.raw`src\hidden.ts`, null],
	];

	it.each(cases)(
		"classifies %s and its Windows form the same way",
		(posixPath, windowsPath, reason) => {
			expect(exclusionReasonForCandidate(posixPath, openPolicy)).toBe(reason);
			expect(exclusionReasonForCandidate(windowsPath, openPolicy)).toBe(reason);
		},
	);

	it("uses the shared selection reason for a Windows-style include miss", () => {
		const include = compileIncludeMatcher(["src"]);
		const policy = {
			ignored: false,
			includePatterns: include.includePatterns,
			matchesAislopIgnore: () => false,
			matchesInclude: include.matchesInclude,
			matchesUserExclude: () => false,
		};
		expect(exclusionReasonForCandidate(String.raw`lib\util.ts`, policy)).toBe("include-filter");
		expect(exclusionReasonForCandidate("lib/util.ts", policy)).toBe("include-filter");
		expect(
			pathSelectionReason("vendor/lib.go", {
				excludedDirectories: EXCLUDED_SOURCE_DIRECTORIES,
				extraExtensions: new Set(),
				ignored: false,
				includePatterns: [],
				matchesAislopIgnore: () => false,
				matchesInclude: () => false,
				matchesUserExclude: () => false,
				testFiles: false,
			}),
		).toBe("builtin-directory");
		expect(
			pathSelectionReason("src/app.test.ts", {
				excludedDirectories: TEST_EXCLUDED_DIRECTORIES,
				extraExtensions: new Set(),
				ignored: false,
				includePatterns: [],
				matchesAislopIgnore: () => false,
				matchesInclude: () => false,
				matchesUserExclude: () => false,
				testFiles: true,
			}),
		).toBe(null);
	});
});

describe("explain scan scope", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-explain-scope-"));
		git(tmpDir, ["init"]);
		git(tmpDir, ["config", "user.email", "test@example.com"]);
		git(tmpDir, ["config", "user.name", "test"]);
		git(tmpDir, ["config", "commit.gpgsign", "false"]);
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const writeFixture = () => {
		createFile(tmpDir, ".gitignore", "secret.ts\n");
		createFile(tmpDir, ".aislopignore", "scratch/\n");
		createFile(tmpDir, "src/app.ts", `export const token = "${SECRET}";\n`);
		createFile(tmpDir, "src/app.test.ts", "expect(true).toBe(true);\n");
		createFile(tmpDir, "src/types.d.ts", "export declare const ready: boolean;\n");
		createFile(tmpDir, "src/app.swift", "import Foundation\n");
		createFile(tmpDir, "src/app.min.js", "function minified(){return 1}\n");
		createFile(tmpDir, "src/hand.ts", "DO NOT EDIT this file was generated by a tool\n");
		createFile(tmpDir, "vendor/lib.go", "package lib\n");
		createFile(tmpDir, "tests/helper.ts", "export const helper = true;\n");
		createFile(tmpDir, "tests/test_pipeline.py", "assert True\n");
		createFile(tmpDir, "secret.ts", "export const secret = true;\n");
		createFile(tmpDir, "scratch/note.ts", "export const note = true;\n");
		createFile(tmpDir, "legacy/old.ts", "export const old = true;\n");
	};

	const request = () => ({
		aislopIgnore: ["scratch/"],
		include: [] as string[],
		mode: { kind: "full" as const },
		rootDirectory: tmpDir,
		userExclude: ["legacy"],
	});

	it("matches the scan selection and groups every exclusion reason", () => {
		writeFixture();
		const input = request();
		const mergedExclude = [...input.userExclude, ...input.aislopIgnore];
		const scope = collectScanFileScope({
			excludePatterns: mergedExclude,
			includePatterns: input.include,
			mode: input.mode,
			rootDirectory: tmpDir,
		});
		const classified = classifyScanScope(input);

		expect(classified.production).toEqual(relativePaths(tmpDir, scope.files));
		expect(classified.test).toEqual(relativePaths(tmpDir, scope.testFiles));
		expect(classified.declaration).toEqual(
			relativePaths(
				tmpDir,
				filterProjectDeclarationFiles(
					tmpDir,
					listProjectFiles(tmpDir),
					mergedExclude,
					input.include,
				),
			),
		);
		expect(classified.unsupported).toEqual(
			relativePaths(
				tmpDir,
				listUnsupportedCoverageFiles(tmpDir, {
					excludePatterns: mergedExclude,
					includePatterns: input.include,
				}),
			),
		);
		expect(classified.scanMode).toBe("full");
		expect(classified.baseRef).toBeNull();
		expect(classified.languages).toEqual(["python", "typescript"]);
		expect(classified.production).toEqual(["src/app.ts", "src/hand.ts", "src/types.d.ts"]);
		expect(classified.test).toEqual(["src/app.test.ts", "tests/test_pipeline.py"]);
		expect(classified.declaration).toEqual(["src/types.d.ts"]);
		expect(classified.unsupported).toEqual(["src/app.swift"]);
		expect(classified.exclusions["builtin-directory"]).toEqual([
			".git",
			"tests/helper.ts",
			"vendor/lib.go",
		]);
		expect(classified.exclusions.generated).toEqual(["src/app.min.js"]);
		expect(classified.exclusions.gitignore).toEqual(["secret.ts"]);
		expect(classified.exclusions.aislopignore).toEqual(["scratch/note.ts"]);
		expect(classified.exclusions["user-exclude"]).toEqual(["legacy/old.ts"]);
		expect(classified.exclusions["include-filter"]).toEqual([]);
	});

	it("attributes an include miss without taking vendor files from directory policy", () => {
		createFile(tmpDir, "src/app.ts", "export const app = true;\n");
		createFile(tmpDir, "lib/util.ts", "export const util = true;\n");
		createFile(tmpDir, "vendor/lib.go", "package lib\n");
		const classified = classifyScanScope({
			aislopIgnore: [],
			include: ["src"],
			mode: { kind: "full" },
			rootDirectory: tmpDir,
			userExclude: [],
		});
		expect(classified.production).toEqual(["src/app.ts"]);
		expect(classified.exclusions["include-filter"]).toEqual(["lib/util.ts"]);
		expect(classified.exclusions["builtin-directory"]).toEqual([".git", "vendor/lib.go"]);
	});

	it("keeps tracked files that match gitignore in the production set", () => {
		createFile(tmpDir, ".gitignore", "kept.ts\ndropped.ts\n");
		createFile(tmpDir, "kept.ts", "export const kept = true;\n");
		createFile(tmpDir, "dropped.ts", "export const dropped = true;\n");
		git(tmpDir, ["add", "-f", "kept.ts"]);
		const classified = classifyScanScope({
			aislopIgnore: [],
			include: [],
			mode: { kind: "full" },
			rootDirectory: tmpDir,
			userExclude: [],
		});
		expect(classified.production).toContain("kept.ts");
		expect(classified.exclusions.gitignore).toContain("dropped.ts");
		expect(classified.exclusions.gitignore).not.toContain("kept.ts");
	});

	it("explains changed and staged scopes with the same file policy", () => {
		createFile(tmpDir, "src/kept.ts", "export const kept = 1;\n");
		createFile(tmpDir, "src/types.d.ts", "export declare const ready: boolean;\n");
		git(tmpDir, ["add", "src/kept.ts", "src/types.d.ts"]);
		git(tmpDir, ["commit", "-m", "init", "--no-verify"]);
		createFile(tmpDir, "src/changed.ts", "export const changed = 1;\n");
		createFile(tmpDir, "vendor/changed.go", "package changed\n");
		git(tmpDir, ["add", "vendor/changed.go"]);

		const changes = classifyScanScope({
			aislopIgnore: [],
			include: [],
			mode: { kind: "changes", base: "HEAD" },
			rootDirectory: tmpDir,
			userExclude: [],
		});
		const scope = collectScanFileScope({
			excludePatterns: [],
			includePatterns: [],
			mode: { kind: "changes", base: "HEAD" },
			rootDirectory: tmpDir,
		});
		expect(changes.scanMode).toBe("changes");
		expect(changes.baseRef).toBe("HEAD");
		expect(changes.production).toEqual(relativePaths(tmpDir, scope.files));
		expect(changes.production).toContain("src/changed.ts");
		expect(changes.production).not.toContain("src/kept.ts");
		expect(changes.exclusions["builtin-directory"]).toContain("vendor/changed.go");
		expect(changes.declaration).toEqual(["src/types.d.ts"]);

		const staged = classifyScanScope({
			aislopIgnore: [],
			include: [],
			mode: { kind: "staged" },
			rootDirectory: tmpDir,
			userExclude: [],
		});
		expect(staged.scanMode).toBe("staged");
		expect(staged.baseRef).toBeNull();
		expect(staged.production).not.toContain("src/changed.ts");
		expect(staged.exclusions["builtin-directory"]).toEqual(["vendor/changed.go"]);
	});

	it("renders counts, verbose examples, and stable JSON without secrets or home paths", () => {
		writeFixture();
		process.env.AISLOP_SCOPE_PROBE = SECRET;
		try {
			const report = buildScopeExplanation({ ...request(), homeDirectory: tmpDir });
			const rendered = renderScopeExplanation(report, { verbose: true });
			const json = JSON.stringify(report);
			expect(report.schemaVersion).toBe("1");
			expect(report.projectRoot).toBe("~");
			expect(report.counts).toEqual({
				production: 3,
				test: 2,
				declaration: 1,
				unsupported: 1,
				excluded: report.exclusions.reduce((sum, group) => sum + group.count, 0),
			});
			expect(report.exclusions.map((group) => group.reason)).toEqual([
				"builtin-directory",
				"generated",
				"gitignore",
				"aislopignore",
				"user-exclude",
				"include-filter",
			]);
			expect(rendered).toContain("Scope explanation");
			expect(rendered).toContain("Project root");
			expect(rendered).toContain("Scan mode");
			expect(rendered).toContain("vendor/lib.go");
			expect(rendered).not.toContain("Base ref");
			expect(json).not.toContain(SECRET);
			expect(rendered).not.toContain(SECRET);
			expect(json).not.toContain(tmpDir);
			expect(json).not.toContain(os.homedir());
			expect(rendered).not.toMatch(/\/(?:home|Users)\/[^/\s]+/);
			expect(rendered).not.toMatch(/[A-Za-z]:\\Users\\/);
			const quiet = renderScopeExplanation(report);
			expect(quiet).not.toContain("vendor/lib.go");
			expect(quiet).toContain("Built-in directory policy");
		} finally {
			delete process.env.AISLOP_SCOPE_PROBE;
		}
	});

	it("prints the explanation and leaves the tree unchanged", () => {
		writeFixture();
		const before = fs.readdirSync(tmpDir).sort();
		const config = { ...DEFAULT_CONFIG, exclude: ["legacy"], include: [] };
		const output = captureStdout(() => {
			expect(
				explainScopeCommand(tmpDir, config, {
					changes: false,
					staged: false,
					verbose: true,
					json: false,
				}),
			).toBe(0);
		});
		expect(fs.readdirSync(tmpDir).sort()).toEqual(before);
		expect(output).toContain("Scope explanation");
		expect(output).toContain("scratch/note.ts");
		expect(output).toContain("legacy/old.ts");
		expect(output).not.toContain("Scan result");
		expect(output).not.toContain(SECRET);

		const jsonOutput = captureStdout(() => {
			expect(
				explainScopeCommand(tmpDir, config, {
					changes: false,
					staged: false,
					verbose: false,
					json: true,
				}),
			).toBe(0);
		});
		const parsed = JSON.parse(jsonOutput) as { schemaVersion: string; scanMode: string };
		expect(parsed.schemaVersion).toBe("1");
		expect(parsed.scanMode).toBe("full");
	});
});

describe("explain-scope CLI", () => {
	const cli = path.resolve("dist/cli.js");
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-explain-cli-"));
		git(tmpDir, ["init"]);
		createFile(tmpDir, "src/app.ts", "export const app = true;\n");
		createFile(tmpDir, "vendor/lib.go", "package lib\n");
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("exits before a scan report", () => {
		const result = spawnSync(process.execPath, [cli, "scan", tmpDir, "--explain-scope", "--json"], {
			encoding: "utf8",
			env: {
				...process.env,
				AISLOP_SCOPE_PROBE: SECRET,
				AISLOP_NO_TELEMETRY: "1",
				AISLOP_NO_UPDATE_NOTIFIER: "1",
				CI: "1",
				DO_NOT_TRACK: "1",
				NO_COLOR: "1",
			},
		});
		expect(result.status).toBe(0);
		expect(result.stdout).not.toContain(SECRET);
		expect(result.stdout).not.toContain(os.homedir());
		const parsed = JSON.parse(result.stdout) as {
			baseRef: null;
			scanMode: string;
			schemaVersion: string;
		};
		expect(parsed.schemaVersion).toBe("1");
		expect(parsed.scanMode).toBe("full");
		expect(parsed.baseRef).toBeNull();
		expect(result.stdout).not.toContain("Scan result");
	});
});
