import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isPathExcluded, normalizeExcludePatterns } from "../../utils/exclude.js";
import { compileIncludeMatcher } from "../../utils/source-file-selection.js";
import { getSourceFiles } from "../../utils/source-files.js";
import type { Diagnostic, EngineContext } from "../types.js";

const inside = (root: string, file: string): boolean => {
	const relative = path.relative(root, file);
	return (
		relative === "" ||
		(!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
	);
};

const validateJvmTree = (directory: string): string[] => {
	const pending = [directory];
	const jars: string[] = [];
	let entries = 0;
	while (pending.length) {
		const current = pending.pop();
		if (!current) continue;
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			if (++entries > 100_000)
				throw new Error("JVM input tree is too large; configure narrower artifact directories");
			if (entry.isSymbolicLink()) throw new Error("JVM input trees cannot contain symlinks");
			if (/[\r\n\0]/.test(entry.name))
				throw new Error("JVM artifact paths cannot contain newline or NUL characters");
			if (entry.isDirectory()) pending.push(path.join(current, entry.name));
			else if (entry.name.toLowerCase().endsWith(".jar")) jars.push(path.join(current, entry.name));
		}
	}
	return jars;
};

export const jvmInput = (root: string, input: string): string => {
	const file = path.resolve(root, input);
	if (/[\r\n\0]/.test(file))
		throw new Error("JVM artifact paths cannot contain newline or NUL characters");
	if (!inside(root, file)) {
		throw new Error("JVM inputs must stay inside the project, including symlink targets");
	}
	let current = root;
	for (const segment of path.relative(root, file).split(path.sep).filter(Boolean)) {
		current = path.join(current, segment);
		if (fs.lstatSync(current).isSymbolicLink())
			throw new Error("JVM inputs must stay inside the project; symlinks are not supported");
	}
	if (fs.statSync(file).isDirectory()) validateJvmTree(file);
	return file;
};

export const jvmClasspath = (root: string, inputs: string[]): string[] => [
	...new Set(
		inputs.flatMap((input) => {
			const file = jvmInput(root, input);
			return fs.statSync(file).isDirectory() ? [file, ...validateJvmTree(file)] : [file];
		}),
	),
];

export const jvmManifest = (root: string): string =>
	["pom.xml", "build.sbt", "build.gradle.kts", "build.gradle", "build.sc", "build.mill"].find(
		(file) => fs.existsSync(path.join(root, file)),
	) ?? ".aislop/config.yml";

export const jvmFailure = (tool: string, error: unknown, root: string): Diagnostic => ({
	filePath: jvmManifest(root),
	engine: "security",
	rule: "security/jvm-analysis-failed",
	severity: "error",
	message: `${tool} did not complete: ${error instanceof Error ? error.message : String(error)}`,
	help: "Check JVM configuration, compiled artifacts, and tool availability. Run aislop doctor; install tools with aislop-tools --jvm-security.",
	line: 0,
	column: 0,
	category: "JVM Security",
	fixable: false,
});

export const readJvmReport = (file: string): unknown => {
	const stat = fs.statSync(file);
	if (!stat.isFile() || stat.size > 64 * 1024 * 1024)
		throw new Error("Expected a JSON report smaller than 64 MiB");
	return JSON.parse(fs.readFileSync(file, "utf8"));
};

export const jvmSource = (uri: string | undefined, context: EngineContext): string | null => {
	const fallback = jvmManifest(context.rootDirectory);
	if (!uri) return fallback;
	let file: string;
	try {
		file = uri.startsWith("file:") ? fileURLToPath(uri) : decodeURIComponent(uri);
	} catch (error) {
		throw new Error("Invalid source URI in JVM report", { cause: error });
	}
	if (/^[a-z][a-z0-9+.-]*:/i.test(file) && !path.isAbsolute(file)) return fallback;
	file = file.replace(/\\/g, "/");
	const logical = path.resolve(context.rootDirectory, file);
	const roots = [path.resolve(context.rootDirectory), fs.realpathSync(context.rootDirectory)];
	const root = roots.find((candidate) => inside(candidate, logical));
	if (!root) return fallback;
	const relative = path.relative(root, logical).split(path.sep).join("/");
	const excludes = normalizeExcludePatterns(context.excludePatterns ?? []);
	if (isPathExcluded(relative, excludes)) return relative;
	const sources = [
		...(context.projectCandidateFiles ?? []),
		...(context.projectFiles ?? getSourceFiles(context)),
	];
	const matches = [
		...new Set(
			sources.map((source) =>
				path
					.relative(context.rootDirectory, path.resolve(context.rootDirectory, source))
					.split(path.sep)
					.join("/"),
			),
		),
	].filter((source) => source === relative || source.endsWith(`/${relative}`));
	if (matches.length !== 1) return fallback;
	const include = compileIncludeMatcher(context.includePatterns ?? []);
	return include.includePatterns.length > 0 && !include.matchesInclude(matches[0])
		? null
		: matches[0];
};

export const detectJvmBytecode = (root: string): string[] => {
	const candidates = ["target/classes", "build/classes/java/main", "build/classes/scala/main"];
	const target = path.join(root, "target");
	if (fs.existsSync(target)) {
		if (fs.lstatSync(target).isSymbolicLink())
			throw new Error("JVM inputs must stay inside the project; symlinks are not supported");
		for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
			if (entry.name.startsWith("scala-") && entry.isSymbolicLink())
				throw new Error("JVM inputs must stay inside the project; symlinks are not supported");
			if (entry.isDirectory() && entry.name.startsWith("scala-"))
				candidates.push(`target/${entry.name}/classes`);
		}
	}
	return candidates.filter((file) => {
		try {
			return fs.statSync(jvmInput(root, file)).isDirectory();
		} catch (error) {
			if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
			throw error;
		}
	});
};
