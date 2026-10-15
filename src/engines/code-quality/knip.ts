import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { relativePosix } from "../../utils/paths.js";
import { runSubprocess } from "../../utils/subprocess.js";
import type { Diagnostic } from "../types.js";

interface KnipIssueItem {
	name?: string;
	line?: number;
	col?: number;
	symbol?: string;
}

interface KnipFileIssue {
	file: string;
	dependencies?: KnipIssueItem[];
	devDependencies?: KnipIssueItem[];
	unlisted?: KnipIssueItem[];
	unresolved?: KnipIssueItem[];
	binaries?: KnipIssueItem[];
	exports?: KnipIssueItem[];
	types?: KnipIssueItem[];
	duplicates?: KnipIssueItem[];
	files?: KnipIssueItem[];
}

interface KnipJsonOutput {
	files?: string[];
	issues?: KnipFileIssue[];
}

const KNIP_MESSAGE_MAP: Record<string, string> = {
	files: "Unused file",
	dependencies: "Unused dependency",
	devDependencies: "Unused devDependency",
	unlisted: "Unlisted dependency",
	unresolved: "Unresolved import",
	binaries: "Unlisted binary",
	exports: "Unused export",
	types: "Unused type",
	duplicates: "Duplicate export",
};

const DEPENDENCY_TYPES = [
	"dependencies",
	"devDependencies",
	"unlisted",
	"unresolved",
	"binaries",
] as const;

const isDependencyType = (type: string): type is (typeof DEPENDENCY_TYPES)[number] =>
	(DEPENDENCY_TYPES as readonly string[]).includes(type);

const getIssueItems = (fileIssue: KnipFileIssue, issueType: string): KnipIssueItem[] => {
	const items = fileIssue[issueType as keyof KnipFileIssue];
	return Array.isArray(items) ? items : [];
};

// Runner-provided binaries (gh, aws, docker) can't be listed in package.json.
export const shouldIncludeIssue = (issueType: string, filePath: string): boolean => {
	if (issueType !== "binaries") return true;
	const normalized = filePath.replace(/\\/g, "/");
	return !normalized.includes(".github/workflows/");
};

const DEPENDENCY_HELP: Record<string, string> = {
	dependencies:
		"This package is listed in package.json but not imported anywhere. Remove it with `npm uninstall` or `aislop fix`.",
	devDependencies:
		"This package is listed in package.json but not imported anywhere. Remove it with `npm uninstall` or `aislop fix`.",
	unlisted:
		"This package is imported in code but not declared in package.json. Run `npm install` to add it.",
	unresolved: "This import cannot be resolved. Check for typos or missing packages.",
	binaries: "This binary is used but its package is not in package.json.",
};

const collectIssues = (
	fileIssue: KnipFileIssue,
	issueType: string,
	rootDir: string,
	knipCwd: string,
): Diagnostic[] => {
	const diagnostics: Diagnostic[] = [];
	if (!shouldIncludeIssue(issueType, fileIssue.file)) return diagnostics;
	const issues = getIssueItems(fileIssue, issueType);
	const isDepType = isDependencyType(issueType);
	const category = isDepType ? "Dependencies" : "Dead Code";
	const severity = issueType === "unlisted" || issueType === "unresolved" ? "error" : "warning";
	const fixable =
		issueType === "dependencies" ||
		issueType === "devDependencies" ||
		issueType === "exports" ||
		issueType === "types" ||
		issueType === "duplicates";
	const help = DEPENDENCY_HELP[issueType] ?? "";

	for (const issue of issues) {
		const symbol = issue.name ?? issue.symbol ?? "unknown";
		const absolutePath = path.resolve(knipCwd, fileIssue.file);
		diagnostics.push({
			filePath: relativePosix(rootDir, absolutePath),
			engine: "code-quality",
			rule: `knip/${issueType}`,
			severity,
			message: `${KNIP_MESSAGE_MAP[issueType]}: ${symbol}`,
			help,
			line: issue.line ?? 0,
			column: issue.col ?? 0,
			category,
			fixable,
		});
	}

	return diagnostics;
};

const findMonorepoRoot = (directory: string): string | null => {
	let current = directory;
	while (current !== path.dirname(current)) {
		if (
			fs.existsSync(path.join(current, "pnpm-workspace.yaml")) ||
			(() => {
				const pkgPath = path.join(current, "package.json");
				if (!fs.existsSync(pkgPath)) return false;
				const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
				return Array.isArray(pkg.workspaces) || pkg.workspaces?.packages;
			})()
		) {
			return current;
		}
		current = path.dirname(current);
	}
	return null;
};

const isSubpath = (parent: string, child: string): boolean => {
	const relative = path.relative(parent, child);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

export const getRelativePathWithinRoot = (
	rootDirectory: string,
	baseDirectory: string,
	reportedPath: string,
): string | null => {
	const rootPath = path.resolve(rootDirectory);
	const absolutePath = path.resolve(baseDirectory, reportedPath);
	if (!isSubpath(rootPath, absolutePath)) return null;
	return relativePosix(rootPath, absolutePath);
};

export const getSafeUnusedFilePath = (rootDirectory: string, filePath: string): string | null => {
	const rootPath = fs.realpathSync(rootDirectory);
	const absolutePath = path.resolve(rootDirectory, filePath);

	let stat: fs.Stats;
	let realPath: string;
	try {
		stat = fs.lstatSync(absolutePath);
		realPath = fs.realpathSync(absolutePath);
	} catch {
		return null;
	}

	if (!stat.isFile()) return null;
	if (!isSubpath(rootPath, realPath)) return null;
	return absolutePath;
};

const KNIP_BIN = path.join("bin", "knip.js");
const requireFromAislop = createRequire(import.meta.url);

const findPackageRoot = (entryPath: string, packageName: string): string | null => {
	let current = path.dirname(entryPath);
	while (current !== path.dirname(current)) {
		const pkgPath = path.join(current, "package.json");
		if (fs.existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
				if (pkg.name === packageName) return current;
			} catch {
				return null;
			}
		}
		current = path.dirname(current);
	}
	return null;
};

const findBundledKnipBin = (): string | null => {
	try {
		const knipEntry = requireFromAislop.resolve("knip");
		const knipRoot = findPackageRoot(knipEntry, "knip");
		if (!knipRoot) return null;

		const binPath = path.join(knipRoot, KNIP_BIN);
		return fs.existsSync(binPath) ? binPath : null;
	} catch {
		return null;
	}
};

// Config file names Knip itself looks for (https://knip.dev/overview/configuration).
const KNIP_CONFIG_FILES = [
	"knip.json",
	"knip.jsonc",
	".knip.json",
	".knip.jsonc",
	"knip.ts",
	"knip.js",
	"knip.config.ts",
	"knip.config.js",
];

const readPackageJson = (directory: string): Record<string, unknown> | null => {
	const pkgPath = path.join(directory, "package.json");
	if (!fs.existsSync(pkgPath)) return null;
	try {
		return JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as Record<string, unknown>;
	} catch {
		return null;
	}
};

const declaresKnip = (pkg: Record<string, unknown>): boolean =>
	["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].some((field) => {
		const deps = pkg[field] as Record<string, unknown> | undefined;
		return Boolean(deps?.knip);
	});

// A project opts into Knip by declaring it as a dependency or by configuring it (a knip
// config file or a "knip" key in package.json, as `npx knip` users do). Without either,
// Knip has no entry points to work from and reports whole test or example folders as unused.
export const projectUsesKnip = (directory: string): boolean => {
	const pkg = readPackageJson(directory);
	if (pkg && (declaresKnip(pkg) || pkg.knip !== undefined)) return true;
	return KNIP_CONFIG_FILES.some((name) => fs.existsSync(path.join(directory, name)));
};

// Runs aislop's bundled Knip, never a binary from the scanned project.
export const findKnipRuntime = (
	rootDirectory: string,
	monorepoRoot: string | null,
): { binPath: string; cwd: string } | null => {
	const monorepoUsesKnip = monorepoRoot ? projectUsesKnip(monorepoRoot) : false;
	if (!monorepoUsesKnip && !projectUsesKnip(rootDirectory)) return null;

	const binPath = findBundledKnipBin();
	if (!binPath) return null;

	const cwd = monorepoRoot && monorepoUsesKnip ? monorepoRoot : rootDirectory;
	return { binPath, cwd };
};

const KNIP_SETUP_HELP =
	"Unused files, exports and dependencies were not checked. Add a knip config file (for example knip.json) or add knip to devDependencies to enable the check.";

const knipSkipped = (reason: string, help: string): Diagnostic => ({
	filePath: "package.json",
	engine: "code-quality",
	rule: "knip/skipped",
	severity: "info",
	message: `Unused code check skipped: ${reason}`,
	help,
	line: 0,
	column: 0,
	category: "Dead Code",
	fixable: false,
});

const KNIP_FAILURE_HELP =
	"Knip did not finish, so unused files, exports and dependencies were not checked. Run `npx knip` to see the error.";

const knipFailureReason = (error: unknown): string => {
	const message = error instanceof Error ? error.message : String(error);
	if (/timed out/i.test(message)) return "Knip timed out";
	if (error instanceof SyntaxError) return "Knip output could not be read";
	return "Knip failed to run";
};

export const runKnipDependencyCheck = async (rootDirectory: string): Promise<Diagnostic[]> => {
	const all = await runKnip(rootDirectory);
	return all.filter((d) => d.rule === "knip/dependencies" || d.rule === "knip/devDependencies");
};

export const fixUnusedDependencies = async (rootDirectory: string): Promise<void> => {
	const diagnostics = await runKnipDependencyCheck(rootDirectory);
	if (diagnostics.length === 0) return;

	const pkgPath = path.join(rootDirectory, "package.json");
	if (!fs.existsSync(pkgPath)) return;

	const raw = fs.readFileSync(pkgPath, "utf-8");
	const pkg = JSON.parse(raw) as Record<string, Record<string, string>>;

	const unusedDeps = new Set<string>();
	const unusedDevDeps = new Set<string>();

	for (const d of diagnostics) {
		const pkgName = d.message.replace(/^Unused (dev)?[Dd]ependency: /, "");
		if (d.rule === "knip/dependencies") unusedDeps.add(pkgName);
		if (d.rule === "knip/devDependencies") unusedDevDeps.add(pkgName);
	}

	let changed = false;

	if (pkg.dependencies) {
		for (const name of unusedDeps) {
			if (name in pkg.dependencies) {
				delete pkg.dependencies[name];
				changed = true;
			}
		}
	}

	if (pkg.devDependencies) {
		for (const name of unusedDevDeps) {
			if (name in pkg.devDependencies) {
				delete pkg.devDependencies[name];
				changed = true;
			}
		}
	}

	if (changed) {
		fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);
	}
};

export const runKnipUnusedFiles = async (rootDirectory: string): Promise<Diagnostic[]> => {
	const all = await runKnip(rootDirectory);
	return all.filter((d) => d.rule === "knip/files");
};

export const fixUnusedFiles = async (
	rootDirectory: string,
	allow: (filePath: string) => boolean = () => true,
): Promise<void> => {
	const diagnostics = await runKnipUnusedFiles(rootDirectory);
	for (const d of diagnostics) {
		if (!allow(d.filePath)) continue;
		const absolutePath = getSafeUnusedFilePath(rootDirectory, d.filePath);
		if (absolutePath) {
			fs.unlinkSync(absolutePath);
		}
	}
};

export const runKnip = async (rootDirectory: string): Promise<Diagnostic[]> => {
	// Knip needs a package.json; without one there is no JS project to check.
	if (!readPackageJson(rootDirectory)) return [];
	const monorepoRoot = findMonorepoRoot(rootDirectory);
	if (!projectUsesKnip(rootDirectory) && !(monorepoRoot && projectUsesKnip(monorepoRoot))) {
		return [knipSkipped("Knip is not set up in this project", KNIP_SETUP_HELP)];
	}
	const knipRuntime = findKnipRuntime(rootDirectory, monorepoRoot);
	if (!knipRuntime) {
		return [knipSkipped("the bundled Knip was not found", "Reinstall aislop to restore Knip.")];
	}

	try {
		const args = [knipRuntime.binPath, "--no-progress", "--reporter", "json", "--no-exit-code"];
		const result = await runSubprocess(process.execPath, args, {
			cwd: knipRuntime.cwd,
			timeout: 60000,
			env: { FORCE_COLOR: "0" },
		});
		if (!result.stdout) return [knipSkipped("Knip produced no output", KNIP_FAILURE_HELP)];
		const parsed = JSON.parse(result.stdout) as KnipJsonOutput;

		const diagnostics: Diagnostic[] = [];
		// Knip 5 listed unused files at the top level; Knip 6 nests them under each issue.
		const files = new Set(parsed.files ?? []);
		for (const fileIssue of parsed.issues ?? []) {
			if (getIssueItems(fileIssue, "files").length > 0) files.add(fileIssue.file);
		}
		for (const unusedFile of files) {
			const filePath = getRelativePathWithinRoot(rootDirectory, knipRuntime.cwd, unusedFile);
			if (!filePath) continue;
			diagnostics.push({
				filePath,
				engine: "code-quality",
				rule: "knip/files",
				severity: "warning",
				message: KNIP_MESSAGE_MAP.files,
				help: "This file is not imported by any other file in the project.",
				line: 0,
				column: 0,
				category: "Dead Code",
				fixable: false,
			});
		}

		const issues = parsed.issues ?? [];
		const issueTypes = [...DEPENDENCY_TYPES, "exports", "types", "duplicates"] as const;
		for (const fileIssue of issues) {
			for (const type of issueTypes) {
				diagnostics.push(...collectIssues(fileIssue, type, rootDirectory, knipRuntime.cwd));
			}
		}

		return diagnostics;
	} catch (error) {
		return [knipSkipped(knipFailureReason(error), KNIP_FAILURE_HELP)];
	}
};
