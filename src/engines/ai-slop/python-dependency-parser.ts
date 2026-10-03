import fs from "node:fs";
import path from "node:path";

const MAX_PYTHON_MANIFEST_BYTES = 1_048_576;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

const PYTHON_MANIFEST_FILES = new Set(["pyproject.toml", "Pipfile"]);
const REQUIREMENTS_FILE_RE = /^(?:[\w.-]*[-_.])?requirements(?:[-_.][\w.-]*)?\.(?:txt|in)$/i;
const REQUIREMENTS_DIR = "requirements";
const REQUIREMENTS_INCLUDE_RE = /^(?:-r|--requirement)(?:\s+|=)(\S+)/;
const CONSTRAINT_INCLUDE_RE = /^(?:-c|--constraint)(?:\s+|=)(\S+)/;
const MAX_REQUIREMENTS_FILES = 64;

const isRequirementsFileName = (name: string): boolean => REQUIREMENTS_FILE_RE.test(name);

const isPythonManifestFileName = (name: string): boolean =>
	PYTHON_MANIFEST_FILES.has(name) || isRequirementsFileName(name);

const listDirectory = (directory: string): fs.Dirent[] => {
	try {
		return fs.readdirSync(directory, { withFileTypes: true });
	} catch {
		return [];
	}
};

const CONSTRAINTS_FILE_RE = /constraints?/i;

const isFileEntry = (entry: fs.Dirent): boolean => entry.isFile() || entry.isSymbolicLink();

const isSeedFileName = (name: string): boolean => !CONSTRAINTS_FILE_RE.test(name);

const requirementsDirFiles = (directory: string): string[] =>
	listDirectory(path.join(directory, REQUIREMENTS_DIR))
		.filter(
			(entry) =>
				isFileEntry(entry) && /\.(?:txt|in)$/i.test(entry.name) && isSeedFileName(entry.name),
		)
		.map((entry) => path.join(directory, REQUIREMENTS_DIR, entry.name));

const requirementsFilesIn = (directory: string, entries: fs.Dirent[]): string[] => [
	...entries
		.filter(
			(entry) =>
				isFileEntry(entry) && isRequirementsFileName(entry.name) && isSeedFileName(entry.name),
		)
		.map((entry) => path.join(directory, entry.name)),
	...(entries.some((entry) => entry.isDirectory() && entry.name === REQUIREMENTS_DIR)
		? requirementsDirFiles(directory)
		: []),
];

export const hasPythonManifest = (
	directory: string,
	entries: fs.Dirent[] = listDirectory(directory),
): boolean =>
	entries.some((entry) => isFileEntry(entry) && isPythonManifestFileName(entry.name)) ||
	requirementsFilesIn(directory, entries).length > 0;

const isWithinDirectory = (directory: string, filePath: string): boolean => {
	const relative = path.relative(directory, filePath);
	return (
		relative === "" ||
		(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
	);
};

const readPythonManifest = (filePath: string, boundaryDir: string): string | null => {
	let descriptor: number | null = null;
	try {
		const realBoundary = fs.realpathSync(boundaryDir);
		const realFile = fs.realpathSync(filePath);
		if (!isWithinDirectory(realBoundary, realFile)) return null;
		descriptor = fs.openSync(realFile, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
		const stat = fs.fstatSync(descriptor);
		if (!stat.isFile() || stat.size > MAX_PYTHON_MANIFEST_BYTES) return null;
		const content = Buffer.alloc(stat.size);
		let offset = 0;
		while (offset < content.length) {
			const bytesRead = fs.readSync(descriptor, content, offset, content.length - offset, null);
			if (bytesRead === 0) break;
			offset += bytesRead;
		}
		const overflow = Buffer.alloc(1);
		if (fs.readSync(descriptor, overflow, 0, 1, null) > 0) return null;
		return UTF8_DECODER.decode(content.subarray(0, offset));
	} catch {
		return null;
	} finally {
		if (descriptor !== null) fs.closeSync(descriptor);
	}
};

export const readPyproject = (rootDir: string): string | null =>
	readPythonManifest(path.join(rootDir, "pyproject.toml"), rootDir);

export const addPyDep = (pyDeps: Set<string>, name: string): void => {
	const match = name.trim().match(/^([a-zA-Z0-9_.-]+)/);
	if (!match) return;
	const normalized = match[1].toLowerCase().replace(/_/g, "-");
	pyDeps.add(normalized);
};

interface RequirementsFile {
	content: string;
	requirements: string[];
	constraints: string[];
}

const includedPaths = (content: string, filePath: string, pattern: RegExp): string[] =>
	content
		.split("\n")
		.map((line) => line.trim().match(pattern)?.[1])
		.filter((target): target is string => target !== undefined)
		.map((target) => path.resolve(path.dirname(filePath), target));

const readRequirementsFile = (filePath: string, rootDir: string): RequirementsFile | null => {
	const content = readPythonManifest(filePath, rootDir);
	if (content === null) return null;
	return {
		content,
		requirements: includedPaths(content, filePath, REQUIREMENTS_INCLUDE_RE),
		constraints: includedPaths(content, filePath, CONSTRAINT_INCLUDE_RE),
	};
};

const addRequirementsLines = (content: string, pyDeps: Set<string>): void => {
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
		const match = trimmed.match(/^([a-zA-Z0-9_\-.]+)/);
		if (match) addPyDep(pyDeps, match[1]);
	}
};

export const collectFromRequirementsFiles = (rootDir: string, pyDeps: Set<string>): boolean => {
	const pending = requirementsFilesIn(rootDir, listDirectory(rootDir));
	const visited = new Set<string>();
	const constraints = new Set<string>();
	const files = new Map<string, string>();
	for (let i = 0; i < pending.length && visited.size < MAX_REQUIREMENTS_FILES; i += 1) {
		const filePath = pending[i];
		if (visited.has(filePath)) continue;
		visited.add(filePath);
		const file = readRequirementsFile(filePath, rootDir);
		if (!file) continue;
		files.set(filePath, file.content);
		pending.push(...file.requirements);
		for (const constraint of file.constraints) constraints.add(constraint);
	}
	for (const [filePath, content] of files) {
		if (!constraints.has(filePath)) addRequirementsLines(content, pyDeps);
	}
	return files.size > 0;
};

const TOML_HEADER_RE = /^\s*\[([^\]]+)\]\s*$/;

const readTomlSection = (content: string, sectionName: string): string => {
	const lines = content.split(/\r?\n/);
	const sectionLines: string[] = [];
	let inSection = false;

	for (const line of lines) {
		const header = line.match(TOML_HEADER_RE);
		if (header) {
			if (inSection) break;
			inSection = header[1] === sectionName;
			continue;
		}
		if (inSection) sectionLines.push(line);
	}

	return sectionLines.join("\n");
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractTomlArrayBody = (section: string, key: string): string | null => {
	const match = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*\\[`, "m").exec(section);
	if (!match) return null;

	const openingIndex = match.index + match[0].lastIndexOf("[");
	const start = openingIndex + 1;
	let depth = 1;
	let quote: string | null = null;
	let escaped = false;

	for (let i = start; i < section.length; i += 1) {
		const char = section[i];
		if (quote) {
			if (quote === '"' && !escaped && char === "\\") {
				escaped = true;
				continue;
			}
			if (!escaped && char === quote) quote = null;
			escaped = false;
			continue;
		}

		// A `#` outside a string begins a comment to end-of-line. Skipping it keeps
		// quote/bracket tracking correct when a comment holds an apostrophe or a
		// bracket (e.g. `"pr-crew",  # the dashboard's (lazy) use`).
		if (char === "#") {
			const newline = section.indexOf("\n", i);
			if (newline === -1) return null;
			i = newline;
			continue;
		}
		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}
		if (char === "[") {
			depth += 1;
		} else if (char === "]") {
			depth -= 1;
			if (depth === 0) return section.slice(start, i);
		}
	}

	return null;
};

const extractTomlStrings = (source: string): string[] => {
	const values: string[] = [];
	let quote: string | null = null;
	let escaped = false;
	let current = "";

	for (let i = 0; i < source.length; i += 1) {
		const char = source[i];
		if (!quote) {
			// Skip `#` comments so quoted prose inside them isn't read as a value.
			if (char === "#") {
				const newline = source.indexOf("\n", i);
				if (newline === -1) break;
				i = newline;
				continue;
			}
			if (char === '"' || char === "'") {
				quote = char;
				current = "";
				escaped = false;
			}
			continue;
		}

		if (quote === '"' && !escaped && char === "\\") {
			escaped = true;
			continue;
		}
		if (!escaped && char === quote) {
			values.push(current);
			quote = null;
			current = "";
			continue;
		}
		current += char;
		escaped = false;
	}

	return values;
};

const addTomlArrayDeps = (section: string, key: string, pyDeps: Set<string>): void => {
	const body = extractTomlArrayBody(section, key);
	if (!body) return;
	for (const value of extractTomlStrings(body)) {
		addPyDep(pyDeps, value);
	}
};

export const collectFromPyproject = (rootDir: string, pyDeps: Set<string>): boolean => {
	try {
		const content = readPyproject(rootDir);
		if (content === null) return false;
		const projectSection = readTomlSection(content, "project");
		const projectNameMatch = projectSection.match(/^\s*name\s*=\s*["']([^"']+)/m);
		if (projectNameMatch) addPyDep(pyDeps, projectNameMatch[1]);

		const poetrySection = readTomlSection(content, "tool.poetry");
		const poetryNameMatch = poetrySection.match(/^\s*name\s*=\s*["']([^"']+)/m);
		if (poetryNameMatch) addPyDep(pyDeps, poetryNameMatch[1]);

		addTomlArrayDeps(projectSection, "dependencies", pyDeps);

		// PEP 621 extras: [project.optional-dependencies] holds arrays of requirements.
		const extras = readTomlSection(content, "project.optional-dependencies");
		if (extras) {
			for (const value of extractTomlStrings(extras)) addPyDep(pyDeps, value);
		}
		// PEP 735 dependency groups: [dependency-groups] holds named arrays of requirements.
		const groups = readTomlSection(content, "dependency-groups");
		if (groups) {
			for (const value of extractTomlStrings(groups)) addPyDep(pyDeps, value);
		}
		const poetryRe =
			/\[tool\.poetry(?:\.group\.[a-z0-9_-]+)?\.dependencies\]([\s\S]*?)(?=\n\[|$)/gi;
		let match: RegExpExecArray | null = poetryRe.exec(content);
		while (match !== null) {
			for (const line of match[1].split("\n")) {
				const m = line.trim().match(/^([a-zA-Z0-9_\-.]+)\s*=/);
				if (m && m[1] !== "python") addPyDep(pyDeps, m[1]);
			}
			match = poetryRe.exec(content);
		}
		return true;
	} catch {
		return false;
	}
};

export const collectFromPipfile = (rootDir: string, pyDeps: Set<string>): boolean => {
	const pipfilePath = path.join(rootDir, "Pipfile");
	try {
		const content = readPythonManifest(pipfilePath, rootDir);
		if (content === null) return false;
		const sectionRe = /\[(packages|dev-packages)\]([\s\S]*?)(?=\n\[|$)/g;
		let match: RegExpExecArray | null = sectionRe.exec(content);
		while (match !== null) {
			for (const line of match[2].split("\n")) {
				const m = line.trim().match(/^([a-zA-Z0-9_\-.]+)\s*=/);
				if (m) addPyDep(pyDeps, m[1]);
			}
			match = sectionRe.exec(content);
		}
		return true;
	} catch {
		return false;
	}
};

const TOML_TABLE_LINE_RE = /^\s*\[{1,2}[^[\]\n]+\]{1,2}\s*(?:#.*)?$/m;
const INLINE_SCRIPT_BLOCK_RE = /^# \/\/\/ script\r?\n((?:^#(?: .*)?\r?\n)+)^# \/\/\/\s*$/m;

export const collectFromInlineScriptMetadata = (source: string, pyDeps: Set<string>): boolean => {
	const block = INLINE_SCRIPT_BLOCK_RE.exec(source);
	if (!block) return false;
	const toml = block[1]
		.split(/\r?\n/)
		.map((line) => line.replace(/^# ?/, ""))
		.join("\n");
	const firstTable = toml.search(TOML_TABLE_LINE_RE);
	const topLevel = firstTable === -1 ? toml : toml.slice(0, firstTable);
	const body = extractTomlArrayBody(topLevel, "dependencies");
	for (const value of body === null ? [] : extractTomlStrings(body)) addPyDep(pyDeps, value);
	return true;
};
