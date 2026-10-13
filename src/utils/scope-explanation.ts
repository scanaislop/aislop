import path from "node:path";
import type { ScanScopeMode } from "../commands/scan-file-scope.js";
import { collectScanFileScope } from "../commands/scan-file-scope.js";
import { detectSourceLanguages } from "./discover.js";
import { listUnsupportedCoverageFiles } from "./discovery-coverage.js";
import { getChangedFiles, getStagedFiles } from "./git.js";
import { getIgnoredPaths, resetGitIgnoreSnapshots } from "./git-ignore.js";
import { enumerateProjectTree } from "./project-file-list.js";
import { displayScopePath, normalizeScopePath } from "./scope-path.js";
import {
	EXCLUDED_SOURCE_DIRECTORIES,
	isTestFile,
	isWithinProject,
	TEST_EXCLUDED_DIRECTORIES,
	toProjectPath,
} from "./source-file-policy.js";
import {
	compileExcludeMatcher,
	compileIncludeMatcher,
	declarationPathReason,
	filterProjectDeclarationFiles,
	listProjectFiles,
	type PathDropReason,
	pathSelectionReason,
} from "./source-file-selection.js";

const EXCLUSION_REASONS = [
	"builtin-directory",
	"generated",
	"gitignore",
	"aislopignore",
	"user-exclude",
	"include-filter",
] as const;

export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

const EXCLUSION_LABELS: Readonly<Record<ExclusionReason, string>> = {
	"builtin-directory": "Built-in directory policy",
	generated: "Generated files",
	gitignore: ".gitignore",
	aislopignore: ".aislopignore",
	"user-exclude": "User exclude",
	"include-filter": "Include filtering",
};

const SAMPLE_LIMIT = 5;
const NO_EXTRA_EXTENSIONS: ReadonlySet<string> = new Set();
// Dependency and VCS stores are pruned by the scan walk. Report the directory
// itself instead of reading every nested file.
const HEAVY_WALK_PRUNE = new Set(["node_modules", ".git", ".pnpm-store", ".yarn"]);

export interface ScopeExplanationRequest {
	readonly aislopIgnore: readonly string[];
	readonly homeDirectory?: string;
	readonly include: readonly string[];
	readonly mode: ScanScopeMode;
	readonly rootDirectory: string;
	readonly userExclude: readonly string[];
}

export interface CandidatePolicy {
	readonly ignored: boolean;
	readonly includePatterns: readonly string[];
	readonly matchesAislopIgnore: (filePath: string) => boolean;
	readonly matchesInclude: (filePath: string) => boolean;
	readonly matchesUserExclude: (filePath: string) => boolean;
}

export interface ScopeExclusionGroup {
	readonly count: number;
	readonly examples: readonly string[];
	readonly label: string;
	readonly reason: ExclusionReason;
	readonly truncated: boolean;
}

export interface ScopeExplanation {
	readonly baseRef: string | null;
	readonly counts: {
		readonly declaration: number;
		readonly excluded: number;
		readonly production: number;
		readonly test: number;
		readonly unsupported: number;
	};
	readonly exclusions: readonly ScopeExclusionGroup[];
	readonly languages: readonly string[];
	readonly projectRoot: string;
	readonly samples: {
		readonly declaration: readonly string[];
		readonly production: readonly string[];
		readonly test: readonly string[];
		readonly unsupported: readonly string[];
	};
	readonly scanMode: ScanScopeMode["kind"];
	readonly schemaVersion: "1";
}

export interface ClassifiedScanScope {
	readonly baseRef: string | null;
	readonly declaration: readonly string[];
	readonly exclusions: Readonly<Record<ExclusionReason, readonly string[]>>;
	readonly languages: readonly string[];
	readonly production: readonly string[];
	readonly scanMode: ScanScopeMode["kind"];
	readonly test: readonly string[];
	readonly unsupported: readonly string[];
}

const uniqueSorted = (paths: readonly string[]): string[] => [...new Set(paths)].sort();

const toRelativeSorted = (rootDirectory: string, files: readonly string[]): string[] =>
	uniqueSorted(files.map((file) => normalizeScopePath(toProjectPath(rootDirectory, file))));

const emptyExclusions = (): Record<ExclusionReason, string[]> => ({
	"builtin-directory": [],
	generated: [],
	gitignore: [],
	aislopignore: [],
	"user-exclude": [],
	"include-filter": [],
});

const asExclusionReason = (reason: PathDropReason | null): ExclusionReason | null => {
	if (
		reason === "builtin-directory" ||
		reason === "generated" ||
		reason === "gitignore" ||
		reason === "aislopignore" ||
		reason === "user-exclude" ||
		reason === "include-filter"
	) {
		return reason;
	}
	return null;
};

const sharedPolicy = (policy: CandidatePolicy) => ({
	includePatterns: policy.includePatterns,
	matchesAislopIgnore: policy.matchesAislopIgnore,
	matchesInclude: policy.matchesInclude,
	matchesUserExclude: policy.matchesUserExclude,
});

export const exclusionReasonForCandidate = (
	relativePath: string,
	policy: CandidatePolicy,
): ExclusionReason | null => {
	const normalized = normalizeScopePath(relativePath);
	const shared = sharedPolicy(policy);
	if (isTestFile(normalized)) {
		return asExclusionReason(
			pathSelectionReason(normalized, {
				...shared,
				excludedDirectories: TEST_EXCLUDED_DIRECTORIES,
				extraExtensions: NO_EXTRA_EXTENSIONS,
				ignored: policy.ignored,
				testFiles: true,
			}),
		);
	}
	if (normalized.endsWith(".d.ts")) {
		const decision = declarationPathReason(normalized, shared);
		if (decision === "builtin-directory") return "builtin-directory";
		if (policy.ignored) return "gitignore";
		return asExclusionReason(decision);
	}
	return asExclusionReason(
		pathSelectionReason(normalized, {
			...shared,
			excludedDirectories: EXCLUDED_SOURCE_DIRECTORIES,
			extraExtensions: NO_EXTRA_EXTENSIONS,
			ignored: policy.ignored,
			testFiles: false,
		}),
	);
};

const candidatePolicy = (request: ScopeExplanationRequest): Omit<CandidatePolicy, "ignored"> => {
	const include = compileIncludeMatcher(request.include);
	return {
		includePatterns: include.includePatterns,
		matchesAislopIgnore: compileExcludeMatcher(request.aislopIgnore),
		matchesInclude: include.matchesInclude,
		matchesUserExclude: compileExcludeMatcher(request.userExclude),
	};
};

const pushReason = (
	exclusions: Record<ExclusionReason, string[]>,
	selected: ReadonlySet<string>,
	relativePath: string,
	policy: Omit<CandidatePolicy, "ignored">,
	ignored: boolean,
): void => {
	const normalized = normalizeScopePath(relativePath);
	if (selected.has(normalized)) return;
	const reason = exclusionReasonForCandidate(normalized, { ...policy, ignored });
	if (reason) exclusions[reason].push(normalized);
};

const collectFullExclusions = (
	rootDirectory: string,
	policy: Omit<CandidatePolicy, "ignored">,
	selected: ReadonlySet<string>,
	exclusions: Record<ExclusionReason, string[]>,
): void => {
	const tree = enumerateProjectTree(rootDirectory, HEAVY_WALK_PRUNE);
	for (const directory of tree.prunedDirectories) {
		const normalized = normalizeScopePath(directory);
		if (!selected.has(normalized)) exclusions["builtin-directory"].push(normalized);
	}
	const ignored = getIgnoredPaths(rootDirectory, tree.files);
	for (const file of tree.files) {
		pushReason(exclusions, selected, file, policy, ignored.has(file));
	}
};

const scopedCandidates = (rootDirectory: string, mode: ScanScopeMode): string[] => {
	if (mode.kind === "staged") return getStagedFiles(rootDirectory);
	if (mode.kind === "changes") return getChangedFiles(rootDirectory, mode.base);
	return [];
};

const collectScopedExclusions = (
	rootDirectory: string,
	mode: ScanScopeMode,
	policy: Omit<CandidatePolicy, "ignored">,
	selected: ReadonlySet<string>,
	exclusions: Record<ExclusionReason, string[]>,
): void => {
	const relativeCandidates = scopedCandidates(rootDirectory, mode)
		.map((file) => toProjectPath(rootDirectory, file))
		.filter((file) => isWithinProject(file));
	const ignored = getIgnoredPaths(rootDirectory, relativeCandidates);
	for (const file of relativeCandidates) {
		pushReason(exclusions, selected, file, policy, ignored.has(file));
	}
};

const mergedExclude = (request: ScopeExplanationRequest): string[] => [
	...request.userExclude,
	...request.aislopIgnore,
];

export const classifyScanScope = (request: ScopeExplanationRequest): ClassifiedScanScope => {
	resetGitIgnoreSnapshots();
	const rootDirectory = path.resolve(request.rootDirectory);
	const excludePatterns = mergedExclude(request);
	const includePatterns = [...request.include];
	const scope = collectScanFileScope({
		excludePatterns,
		includePatterns,
		mode: request.mode,
		rootDirectory,
	});
	const projectCandidates = listProjectFiles(rootDirectory);
	const declarations = filterProjectDeclarationFiles(
		rootDirectory,
		projectCandidates,
		excludePatterns,
		includePatterns,
	);
	const unsupported = listUnsupportedCoverageFiles(rootDirectory, {
		excludePatterns,
		includePatterns,
	});
	const production = toRelativeSorted(rootDirectory, scope.files);
	const test = toRelativeSorted(rootDirectory, scope.testFiles);
	const declaration = toRelativeSorted(rootDirectory, declarations);
	const unsupportedPaths = toRelativeSorted(rootDirectory, unsupported);
	const selected = new Set([...production, ...test, ...declaration, ...unsupportedPaths]);
	const exclusions = emptyExclusions();
	const policy = candidatePolicy(request);
	if (request.mode.kind === "full") {
		collectFullExclusions(rootDirectory, policy, selected, exclusions);
	} else {
		collectScopedExclusions(rootDirectory, request.mode, policy, selected, exclusions);
	}
	for (const reason of EXCLUSION_REASONS) exclusions[reason] = uniqueSorted(exclusions[reason]);
	return {
		baseRef: request.mode.kind === "changes" ? (request.mode.base ?? "HEAD") : null,
		declaration,
		exclusions,
		languages: [...detectSourceLanguages([...scope.files, ...scope.testFiles])].sort(),
		production,
		scanMode: request.mode.kind,
		test,
		unsupported: unsupportedPaths,
	};
};

const samplePaths = (paths: readonly string[], homeDirectory: string | undefined): string[] =>
	paths.slice(0, SAMPLE_LIMIT).map((filePath) => displayScopePath(filePath, homeDirectory));

export const buildScopeExplanation = (request: ScopeExplanationRequest): ScopeExplanation => {
	const classified = classifyScanScope(request);
	const exclusions = EXCLUSION_REASONS.map((reason) => {
		const paths = classified.exclusions[reason];
		return {
			count: paths.length,
			examples: samplePaths(paths, request.homeDirectory),
			label: EXCLUSION_LABELS[reason],
			reason,
			truncated: paths.length > SAMPLE_LIMIT,
		};
	});
	const excluded = exclusions.reduce((sum, group) => sum + group.count, 0);
	return {
		schemaVersion: "1",
		projectRoot: displayScopePath(path.resolve(request.rootDirectory), request.homeDirectory),
		scanMode: classified.scanMode,
		baseRef: classified.baseRef,
		languages: classified.languages,
		counts: {
			production: classified.production.length,
			test: classified.test.length,
			declaration: classified.declaration.length,
			unsupported: classified.unsupported.length,
			excluded,
		},
		samples: {
			production: samplePaths(classified.production, request.homeDirectory),
			test: samplePaths(classified.test, request.homeDirectory),
			declaration: samplePaths(classified.declaration, request.homeDirectory),
			unsupported: samplePaths(classified.unsupported, request.homeDirectory),
		},
		exclusions,
	};
};
