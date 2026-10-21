import type { EngineContext } from "../engines/types.js";
import {
	filterEnumeratedProjectFiles,
	filterEnumeratedTestFiles,
	filterExplicitFiles,
	filterProjectDeclarationFiles,
	filterProjectFiles,
	filterTestFiles,
	listProjectFiles,
} from "./source-file-selection.js";

export const getSourceFilesForRoot = (rootDirectory: string): string[] =>
	filterProjectFiles(rootDirectory, listProjectFiles(rootDirectory));

const getTestFilesForRoot = (rootDirectory: string): string[] =>
	filterTestFiles(rootDirectory, listProjectFiles(rootDirectory));

export const getSourceFiles = (context: EngineContext): string[] =>
	context.files
		? filterExplicitFiles(context.rootDirectory, context.files)
		: getSourceFilesForRoot(context.rootDirectory);

export const getProjectSourceFiles = (context: EngineContext): string[] => {
	if (context.projectFiles) {
		return filterExplicitFiles(context.rootDirectory, context.projectFiles);
	}
	const candidates = listProjectFiles(context.rootDirectory);
	if (context.files && context.files.length > 0) {
		return [
			...getSourceFilesForRoot(context.rootDirectory),
			...filterProjectDeclarationFiles(context.rootDirectory, candidates),
		];
	}
	return [
		...getSourceFiles(context),
		...filterProjectDeclarationFiles(context.rootDirectory, candidates),
	];
};

export const getTestFiles = (context: EngineContext): string[] => {
	if (context.testFiles) {
		return filterEnumeratedTestFiles(context.rootDirectory, context.testFiles);
	}
	if (context.files) return filterTestFiles(context.rootDirectory, context.files);
	return getTestFilesForRoot(context.rootDirectory);
};

const selectWithExtras = (
	context: EngineContext,
	candidates: string[],
	extraExtensions: string[],
	includePatterns: string[] = context.includePatterns ?? [],
): string[] =>
	filterEnumeratedProjectFiles(
		context.rootDirectory,
		candidates,
		extraExtensions,
		context.excludePatterns ?? [],
		includePatterns,
	);

/** Files in the scan's scope, including the extra extensions a detector reads beyond source code. */
export const getSourceFilesWithExtras = (
	context: EngineContext,
	extraExtensions: string[],
): string[] => {
	if (context.candidateFiles) {
		return selectWithExtras(context, context.candidateFiles, extraExtensions);
	}
	return context.files
		? filterExplicitFiles(context.rootDirectory, context.files, extraExtensions)
		: filterProjectFiles(
				context.rootDirectory,
				listProjectFiles(context.rootDirectory),
				extraExtensions,
			);
};

/**
 * Every project file with the given extra extensions, whatever the scan's scope.
 * `include` narrows what is diagnosed, not where references are looked up, so it
 * is not applied here.
 */
export const getProjectFilesWithExtras = (
	context: EngineContext,
	extraExtensions: string[],
): string[] => {
	if (context.projectCandidateFiles) {
		return selectWithExtras(context, context.projectCandidateFiles, extraExtensions, []);
	}
	if (!context.files && !context.candidateFiles) {
		return getSourceFilesWithExtras(context, extraExtensions);
	}
	return selectWithExtras(context, listProjectFiles(context.rootDirectory), extraExtensions, []);
};
