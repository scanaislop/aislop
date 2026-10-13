import path from "node:path";
import picomatch from "picomatch";
import {
	MAX_GLOB_PATTERN_LENGTH,
	normalizeExcludePatterns,
	supportedGlobPatterns,
} from "./exclude.js";
import { isGeneratedArtifactFile } from "./generated-files.js";
import { getIgnoredPaths } from "./git-ignore.js";
import { enumerateProjectFiles, enumerateProjectFilesFromDisk } from "./project-file-list.js";
import {
	EXCLUDED_SOURCE_DIRECTORIES,
	hasAllowedSourceExtension,
	isInExcludedDirectory,
	isSafeRegularProjectFile,
	isTestFile,
	isWithinProject,
	TEST_EXCLUDED_DIRECTORIES,
	toProjectPath,
	WALK_PRUNE_DIRECTORIES,
} from "./source-file-policy.js";

const GENERATED_DECLARATION_DIRECTORIES = new Set(["generated", "__generated__", "auto-generated"]);
const DECLARATION_EXCLUDED_DIRECTORIES = EXCLUDED_SOURCE_DIRECTORIES.filter(
	(directory) => !GENERATED_DECLARATION_DIRECTORIES.has(directory),
);
const DEPENDENCY_AUDIT_INPUT_FILE_RE =
	/(?:^|\/)(?:package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|requirements(?:\.[\w-]+)?\.txt|pyproject\.toml|Pipfile|Pipfile\.lock|poetry\.lock|go\.mod|go\.sum|Cargo\.toml|Cargo\.lock|[\w.-]+\.csproj|packages\.lock\.json|Directory\.Packages\.props)$/i;

export const isDependencyAuditInputFile = (filePath: string): boolean =>
	DEPENDENCY_AUDIT_INPUT_FILE_RE.test(filePath);

export const listProjectFiles = (rootDirectory: string): string[] =>
	enumerateProjectFiles(rootDirectory, WALK_PRUNE_DIRECTORIES);

export const listProjectFilesFromDisk = (rootDirectory: string): string[] =>
	enumerateProjectFilesFromDisk(rootDirectory, WALK_PRUNE_DIRECTORIES);

const normalizeIncludePatterns = (patterns: string[]): string[] =>
	patterns.flatMap((pattern) => {
		const normalized = pattern.trim().replace(/^\.\//, "").replace(/\/$/, "");
		if (normalized === "" || normalized === ".") return ["**"];
		if (normalized.length > MAX_GLOB_PATTERN_LENGTH) return [];
		if (picomatch.scan(normalized).isGlob) return [normalized];
		return supportedGlobPatterns([normalized, `${normalized}/**`]);
	});

const createPathMatcher = (patterns: string[]): ((filePath: string) => boolean) => {
	const matchers = patterns.map((pattern) => picomatch(pattern, { dot: true }));
	return (filePath) => matchers.some((matches) => matches(filePath));
};

const matchesNothing = (_filePath: string): boolean => false;

export interface CompiledIncludeMatcher {
	readonly includePatterns: string[];
	readonly matchesInclude: (filePath: string) => boolean;
}

export const compileExcludeMatcher = (
	patterns: readonly string[],
): ((filePath: string) => boolean) => createPathMatcher(normalizeExcludePatterns([...patterns]));

export const compileIncludeMatcher = (patterns: readonly string[]): CompiledIncludeMatcher => {
	const includePatterns = normalizeIncludePatterns([...patterns]);
	return { includePatterns, matchesInclude: createPathMatcher(includePatterns) };
};

export interface PathPolicy {
	readonly excludedDirectories: readonly string[];
	readonly extraExtensions: ReadonlySet<string>;
	readonly ignored: boolean;
	readonly includePatterns: readonly string[];
	readonly matchesAislopIgnore: (filePath: string) => boolean;
	readonly matchesInclude: (filePath: string) => boolean;
	readonly matchesUserExclude: (filePath: string) => boolean;
	readonly testFiles: boolean;
}

export type PathDropReason =
	| "aislopignore"
	| "builtin-directory"
	| "extension"
	| "generated"
	| "gitignore"
	| "include-filter"
	| "role-mismatch"
	| "user-exclude";

export interface DeclarationPathPolicy {
	readonly includePatterns: readonly string[];
	readonly matchesAislopIgnore: (filePath: string) => boolean;
	readonly matchesInclude: (filePath: string) => boolean;
	readonly matchesUserExclude: (filePath: string) => boolean;
}

// Same checks as the project and test filters, after the file is known to be a
// regular file inside the project. Null means the path stays in that role.
export const pathSelectionReason = (
	relativePath: string,
	policy: PathPolicy,
): PathDropReason | null => {
	if (isInExcludedDirectory(relativePath, policy.excludedDirectories)) return "builtin-directory";
	if (isTestFile(relativePath) !== policy.testFiles) return "role-mismatch";
	if (isGeneratedArtifactFile(relativePath)) return "generated";
	if (policy.ignored) return "gitignore";
	if (policy.includePatterns.length > 0 && !policy.matchesInclude(relativePath)) {
		return "include-filter";
	}
	if (policy.matchesAislopIgnore(relativePath)) return "aislopignore";
	if (policy.matchesUserExclude(relativePath)) return "user-exclude";
	if (!hasAllowedSourceExtension(relativePath, policy.extraExtensions)) return "extension";
	return null;
};

export const declarationPathReason = (
	relativePath: string,
	policy: DeclarationPathPolicy,
): PathDropReason | null => {
	if (!relativePath.endsWith(".d.ts")) return "extension";
	if (isTestFile(relativePath)) return "role-mismatch";
	if (isInExcludedDirectory(relativePath, DECLARATION_EXCLUDED_DIRECTORIES)) {
		return "builtin-directory";
	}
	if (policy.includePatterns.length > 0 && !policy.matchesInclude(relativePath)) {
		return "include-filter";
	}
	if (policy.matchesAislopIgnore(relativePath)) return "aislopignore";
	if (policy.matchesUserExclude(relativePath)) return "user-exclude";
	return null;
};

interface FileFilterOptions {
	readonly exclude: string[];
	readonly extraExtensions: string[];
	readonly include: string[];
	readonly respectGitIgnore: boolean;
	readonly testFiles: boolean;
}

type ProjectFilterOptions = Omit<FileFilterOptions, "testFiles">;
type ProjectFileFilter = (
	rootDirectory: string,
	files: string[],
	extraExtensions?: string[],
	exclude?: string[],
	include?: string[],
) => string[];
type TestFileFilter = (
	rootDirectory: string,
	files: string[],
	exclude?: string[],
	include?: string[],
) => string[];

const filterFiles = (
	rootDirectory: string,
	files: string[],
	options: FileFilterOptions,
): string[] => {
	const extraExtensions = new Set(options.extraExtensions);
	const normalizedFiles = files
		.map((file) => {
			const absolutePath = path.isAbsolute(file) ? file : path.resolve(rootDirectory, file);
			return { absolutePath, relativePath: toProjectPath(rootDirectory, absolutePath) };
		})
		.filter(({ relativePath }) => isWithinProject(relativePath));
	const ignoredPaths = options.respectGitIgnore
		? getIgnoredPaths(
				rootDirectory,
				normalizedFiles.map(({ relativePath }) => relativePath),
			)
		: new Set<string>();
	const include = compileIncludeMatcher(options.include);
	const matchesUserExclude = compileExcludeMatcher(options.exclude);
	const excludedDirectories = options.testFiles
		? TEST_EXCLUDED_DIRECTORIES
		: EXCLUDED_SOURCE_DIRECTORIES;

	return normalizedFiles
		.filter(({ absolutePath, relativePath }) => {
			if (!isSafeRegularProjectFile(rootDirectory, absolutePath)) return false;
			return (
				pathSelectionReason(relativePath, {
					excludedDirectories,
					extraExtensions,
					ignored: ignoredPaths.has(relativePath),
					includePatterns: include.includePatterns,
					matchesAislopIgnore: matchesNothing,
					matchesInclude: include.matchesInclude,
					matchesUserExclude,
					testFiles: options.testFiles,
				}) === null
			);
		})
		.map(({ absolutePath }) => absolutePath);
};

const filterProjectFileSet = (
	rootDirectory: string,
	files: string[],
	options: ProjectFilterOptions,
): string[] => filterFiles(rootDirectory, files, { ...options, testFiles: false });

const filterTestFileSet = (
	rootDirectory: string,
	files: string[],
	options: Omit<ProjectFilterOptions, "extraExtensions">,
): string[] =>
	filterFiles(rootDirectory, files, { ...options, extraExtensions: [], testFiles: true });

const createProjectFileFilter =
	(respectGitIgnore: boolean): ProjectFileFilter =>
	(rootDirectory, files, extraExtensions = [], exclude = [], include = []) =>
		filterProjectFileSet(rootDirectory, files, {
			exclude,
			extraExtensions,
			include,
			respectGitIgnore,
		});

const createTestFileFilter =
	(respectGitIgnore: boolean): TestFileFilter =>
	(rootDirectory, files, exclude = [], include = []) =>
		filterTestFileSet(rootDirectory, files, { exclude, include, respectGitIgnore });

export const filterProjectFiles = createProjectFileFilter(true);
export const filterTestFiles = createTestFileFilter(true);
export const filterEnumeratedProjectFiles = createProjectFileFilter(false);
export const filterEnumeratedTestFiles = createTestFileFilter(false);

export const filterDependencyAuditFiles = (
	rootDirectory: string,
	files: string[],
	exclude: string[] = [],
	include: string[] = [],
): string[] => {
	const excludePatterns = normalizeExcludePatterns(exclude);
	const includePatterns = normalizeIncludePatterns(include);
	const matchesExclude = createPathMatcher(excludePatterns);
	const matchesInclude = createPathMatcher(includePatterns);
	return files
		.map((file) => {
			const absolutePath = path.isAbsolute(file) ? file : path.resolve(rootDirectory, file);
			return { absolutePath, relativePath: toProjectPath(rootDirectory, absolutePath) };
		})
		.filter(({ relativePath }) => {
			if (
				!isWithinProject(relativePath) ||
				isInExcludedDirectory(relativePath, EXCLUDED_SOURCE_DIRECTORIES) ||
				isGeneratedArtifactFile(relativePath) ||
				!isDependencyAuditInputFile(relativePath)
			) {
				return false;
			}
			if (includePatterns.length > 0 && !matchesInclude(relativePath)) {
				return false;
			}
			return !matchesExclude(relativePath);
		})
		.map(({ absolutePath }) => absolutePath);
};

export const filterExplicitFiles = (
	rootDirectory: string,
	files: string[],
	extraExtensions: string[] = [],
): string[] => {
	const extensions = new Set(extraExtensions);
	return files
		.map((file) => {
			const absolutePath = path.isAbsolute(file) ? file : path.resolve(rootDirectory, file);
			return { absolutePath, relativePath: toProjectPath(rootDirectory, absolutePath) };
		})
		.filter(
			({ absolutePath, relativePath }) =>
				isWithinProject(relativePath) &&
				isSafeRegularProjectFile(rootDirectory, absolutePath) &&
				hasAllowedSourceExtension(relativePath, extensions),
		)
		.map(({ absolutePath }) => absolutePath);
};

export const filterProjectDeclarationFiles = (
	rootDirectory: string,
	files: string[],
	exclude: string[] = [],
	include: string[] = [],
): string[] => {
	const includeMatcher = compileIncludeMatcher(include);
	const matchesUserExclude = compileExcludeMatcher(exclude);
	return filterExplicitFiles(rootDirectory, files).filter((filePath) => {
		const relativePath = toProjectPath(rootDirectory, filePath);
		return (
			declarationPathReason(relativePath, {
				includePatterns: includeMatcher.includePatterns,
				matchesAislopIgnore: matchesNothing,
				matchesInclude: includeMatcher.matchesInclude,
				matchesUserExclude,
			}) === null
		);
	});
};
