import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getIgnoredPaths, resetGitIgnoreSnapshots } from "../utils/git-ignore.js";
import { WALK_PRUNE_DIRECTORIES } from "../utils/source-file-policy.js";
import { compileExcludeMatcher, compileIncludeMatcher } from "../utils/source-file-selection.js";
import { readAislopIgnorePatterns } from "../utils/source-files.js";

const SKIP_DIRECTORIES = new Set([...WALK_PRUNE_DIRECTORIES, ".venv", "venv", ".cache"]);
const MAX_SNAPSHOT_BYTES = 128 * 1024 * 1024;

type SnapshotEntry =
	| { readonly kind: "file"; readonly mode: number; readonly content: Buffer }
	| { readonly kind: "symlink"; readonly mode: number; readonly target: string };

interface SnapshotOptions {
	readonly exclude?: readonly string[];
	readonly include?: readonly string[];
	readonly files?: readonly string[];
	readonly maxBytes?: number;
}

export interface WorktreeSnapshot {
	readonly files: Map<string, SnapshotEntry>;
	readonly directories: Set<string>;
	readonly options: SnapshotOptions;
}

export interface FixChange {
	readonly path: string;
	readonly action: "modified" | "created" | "deleted";
	readonly before?: SnapshotEntry;
}

export interface RestoreFailure {
	readonly path: string;
	readonly message: string;
}

const permissionBits = (mode: number): number => mode & 0o777;
const toPosix = (root: string, absolute: string): string =>
	path.relative(root, absolute).split(path.sep).join("/");
const isMissing = (error: unknown): boolean =>
	error instanceof Error && "code" in error && error.code === "ENOENT";

const resolveInside = (root: string, relative: string): string => {
	const absolute = path.resolve(root, relative);
	const fromRoot = path.relative(root, absolute);
	if (
		!fromRoot ||
		fromRoot === ".." ||
		fromRoot.startsWith(`..${path.sep}`) ||
		path.isAbsolute(fromRoot)
	) {
		throw new Error(`Refusing to restore a path outside the project: ${relative}`);
	}
	let parent = path.dirname(absolute);
	while (parent !== root) {
		if (fs.existsSync(parent) && fs.lstatSync(parent).isSymbolicLink()) {
			throw new Error(`Refusing to restore through a symbolic link: ${relative}`);
		}
		parent = path.dirname(parent);
	}
	return absolute;
};

const listEntries = (root: string, options: SnapshotOptions) => {
	const files: string[] = [];
	const directories = new Set<string>();
	const excluded = compileExcludeMatcher([
		...(options.exclude ?? []),
		...readAislopIgnorePatterns(root),
	]);
	const included = compileIncludeMatcher(options.include ?? []);
	const selected = options.files
		? new Set(options.files.map((file) => toPosix(root, path.resolve(root, file))))
		: null;
	const visit = (directory: string): void => {
		for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
			const absolute = path.join(directory, entry.name);
			const relative = toPosix(root, absolute);
			if (entry.isDirectory()) {
				if (SKIP_DIRECTORIES.has(entry.name.toLowerCase()) || excluded(relative)) continue;
				directories.add(relative);
				visit(absolute);
			} else if (
				!excluded(relative) &&
				(!selected || selected.has(relative)) &&
				(included.includePatterns.length === 0 || included.matchesInclude(relative))
			) {
				files.push(relative);
			}
		}
	};
	visit(root);
	resetGitIgnoreSnapshots();
	const ignored = getIgnoredPaths(root, files);
	return { files: files.filter((file) => !ignored.has(file)), directories };
};

export const captureWorktree = (root: string, options: SnapshotOptions = {}): WorktreeSnapshot => {
	const resolved = path.resolve(root);
	const entries = listEntries(resolved, options);
	const snapshot: WorktreeSnapshot = {
		files: new Map(),
		directories: entries.directories,
		options,
	};
	let bytes = 0;
	for (const relative of entries.files) {
		const absolute = path.join(resolved, relative);
		const stat = fs.lstatSync(absolute);
		if (stat.isSymbolicLink()) {
			snapshot.files.set(relative, {
				kind: "symlink",
				mode: stat.mode,
				target: fs.readlinkSync(absolute),
			});
		} else if (stat.isFile()) {
			bytes += stat.size;
			if (bytes > (options.maxBytes ?? MAX_SNAPSHOT_BYTES)) {
				throw new Error(
					"Fix rollback snapshot exceeds its memory limit. Narrow the fix with --changes or --staged.",
				);
			}
			snapshot.files.set(relative, {
				kind: "file",
				mode: stat.mode,
				content: fs.readFileSync(absolute),
			});
		}
	}
	return snapshot;
};

const sameEntry = (left: SnapshotEntry, right: SnapshotEntry): boolean => {
	if (permissionBits(left.mode) !== permissionBits(right.mode)) return false;
	if (left.kind === "symlink" && right.kind === "symlink") return left.target === right.target;
	return left.kind === "file" && right.kind === "file" && left.content.equals(right.content);
};

export const diffFixChanges = (root: string, before: WorktreeSnapshot): FixChange[] => {
	const after = captureWorktree(root, before.options);
	const changes: FixChange[] = [];
	for (const [relative, prior] of before.files) {
		const next = after.files.get(relative);
		if (!next) changes.push({ path: relative, action: "deleted", before: prior });
		else if (!sameEntry(prior, next))
			changes.push({ path: relative, action: "modified", before: prior });
	}
	for (const relative of after.files.keys()) {
		if (!before.files.has(relative)) changes.push({ path: relative, action: "created" });
	}
	return changes;
};

const removePath = (absolute: string): void => {
	try {
		fs.unlinkSync(absolute);
	} catch (error) {
		if (!isMissing(error)) throw error;
	}
};

const writeEntry = (absolute: string, entry: SnapshotEntry): void => {
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	const temporary = path.join(path.dirname(absolute), `.aislop-restore-${randomUUID()}`);
	let ready = false;
	try {
		if (entry.kind === "symlink") fs.symlinkSync(entry.target, temporary);
		else {
			fs.writeFileSync(temporary, entry.content, { flag: "wx", mode: permissionBits(entry.mode) });
			fs.chmodSync(temporary, permissionBits(entry.mode));
		}
		ready = true;
		try {
			fs.renameSync(temporary, absolute);
		} catch (error) {
			throw new Error(`Could not replace file; pre-fix contents saved at ${temporary}`, {
				cause: error,
			});
		}
	} finally {
		if (!ready) removePath(temporary);
	}
};

export const restoreFixChanges = (
	root: string,
	before: WorktreeSnapshot,
	changes: readonly FixChange[],
): RestoreFailure[] => {
	const resolved = path.resolve(root);
	const failures: RestoreFailure[] = [];
	const attempt = (relative: string, restore: () => void): void => {
		try {
			restore();
		} catch (error) {
			failures.push({
				path: relative,
				message: error instanceof Error ? error.message : String(error),
			});
		}
	};
	for (const change of changes) {
		attempt(change.path, () => {
			const absolute = resolveInside(resolved, change.path);
			if (change.action === "created") removePath(absolute);
			else {
				const prior = change.before ?? before.files.get(change.path);
				if (!prior) throw new Error(`Missing rollback snapshot: ${change.path}`);
				writeEntry(absolute, prior);
			}
		});
	}
	const directories = new Set<string>();
	for (const change of changes) {
		if (change.action !== "created") continue;
		let directory = path.posix.dirname(change.path);
		while (directory !== "." && !before.directories.has(directory)) {
			directories.add(directory);
			directory = path.posix.dirname(directory);
		}
	}
	for (const relative of [...directories].sort((a, b) => b.length - a.length)) {
		attempt(relative, () => {
			const absolute = resolveInside(resolved, relative);
			if (!fs.existsSync(absolute) || fs.lstatSync(absolute).isSymbolicLink()) return;
			if (fs.readdirSync(absolute).length === 0) fs.rmdirSync(absolute);
		});
	}
	return failures;
};
