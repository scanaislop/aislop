import fs from "node:fs";
import path from "node:path";

// File-level rollback because git reset, checkout, restore, and clean can
// discard staged, unstaged, and untracked work that this fix did not create.
// `.git` and `node_modules` are skipped: they are not fixer targets, and
// copying them would make the snapshot unbounded.

const SKIP_DIRECTORIES = new Set([".git", "node_modules"]);

interface SnapshotEntry {
	kind: "file" | "symlink";
	mode: number;
	content?: Buffer;
	target?: string;
}

export interface WorktreeSnapshot {
	files: Map<string, SnapshotEntry>;
	directories: Set<string>;
}

export interface FixChange {
	path: string;
	action: "modified" | "created" | "deleted";
	before?: SnapshotEntry;
}

const permissionBits = (mode: number): number => mode & 0o777;

const toPosix = (root: string, abs: string): string =>
	path.relative(root, abs).split(path.sep).join("/");

const resolveInside = (root: string, relPosix: string): string => {
	const abs = path.resolve(root, ...relPosix.split("/"));
	const relative = path.relative(root, abs);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error(`Refusing to restore a path outside the project: ${relPosix}`);
	}
	return abs;
};

const readEntry = (abs: string): SnapshotEntry | null => {
	const stat = fs.lstatSync(abs);
	if (stat.isSymbolicLink()) {
		return { kind: "symlink", mode: stat.mode, target: fs.readlinkSync(abs) };
	}
	if (!stat.isFile()) return null;
	return { kind: "file", mode: stat.mode, content: fs.readFileSync(abs) };
};

const visit = (root: string, dir: string, snapshot: WorktreeSnapshot): void => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (SKIP_DIRECTORIES.has(entry.name)) continue;
			snapshot.directories.add(toPosix(root, abs));
			visit(root, abs, snapshot);
			continue;
		}
		const recorded = readEntry(abs);
		if (!recorded) continue;
		snapshot.files.set(toPosix(root, abs), recorded);
	}
};

export const captureWorktree = (root: string): WorktreeSnapshot => {
	const resolved = path.resolve(root);
	const snapshot: WorktreeSnapshot = { files: new Map(), directories: new Set() };
	visit(resolved, resolved, snapshot);
	return snapshot;
};

const sameEntry = (left: SnapshotEntry, right: SnapshotEntry): boolean => {
	if (left.kind !== right.kind) return false;
	if (permissionBits(left.mode) !== permissionBits(right.mode)) return false;
	if (left.kind === "symlink") return left.target === right.target;
	if (!left.content || !right.content) return false;
	return left.content.equals(right.content);
};

export const diffFixChanges = (root: string, before: WorktreeSnapshot): FixChange[] => {
	const after = captureWorktree(root);
	const changes: FixChange[] = [];
	for (const [rel, prior] of before.files) {
		const next = after.files.get(rel);
		if (!next) {
			changes.push({ path: rel, action: "deleted", before: prior });
			continue;
		}
		if (!sameEntry(prior, next)) {
			changes.push({ path: rel, action: "modified", before: prior });
		}
	}
	for (const rel of after.files.keys()) {
		if (!before.files.has(rel)) changes.push({ path: rel, action: "created" });
	}
	return changes;
};

const removePath = (abs: string): void => {
	let stat: fs.Stats;
	try {
		stat = fs.lstatSync(abs);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
		throw error;
	}
	if (stat.isDirectory() && !stat.isSymbolicLink()) {
		fs.rmSync(abs, { recursive: true, force: true });
		return;
	}
	fs.unlinkSync(abs);
};

const writeEntry = (abs: string, entry: SnapshotEntry): void => {
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	if (entry.kind === "symlink") {
		fs.symlinkSync(entry.target ?? "", abs);
		return;
	}
	fs.writeFileSync(abs, entry.content ?? Buffer.alloc(0));
	fs.chmodSync(abs, permissionBits(entry.mode));
};

const pruneCreatedDirectories = (
	root: string,
	before: WorktreeSnapshot,
	changes: readonly FixChange[],
): void => {
	const candidates = new Set<string>();
	for (const change of changes) {
		if (change.action !== "created") continue;
		let dir = path.posix.dirname(change.path);
		while (dir !== "." && dir !== "") {
			if (before.directories.has(dir)) break;
			candidates.add(dir);
			dir = path.posix.dirname(dir);
		}
	}
	const ordered = [...candidates].sort((a, b) => b.length - a.length);
	for (const rel of ordered) {
		const abs = resolveInside(root, rel);
		let stat: fs.Stats;
		try {
			stat = fs.lstatSync(abs);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
			throw error;
		}
		if (!stat.isDirectory() || stat.isSymbolicLink()) continue;
		if (fs.readdirSync(abs).length === 0) fs.rmdirSync(abs);
	}
};

export const restoreFixChanges = (
	root: string,
	before: WorktreeSnapshot,
	changes: readonly FixChange[],
): void => {
	const resolvedRoot = path.resolve(root);
	for (const change of changes) {
		if (change.action !== "created") continue;
		removePath(resolveInside(resolvedRoot, change.path));
	}
	for (const change of changes) {
		if (change.action === "created") continue;
		const prior = change.before ?? before.files.get(change.path);
		if (!prior) continue;
		const abs = resolveInside(resolvedRoot, change.path);
		removePath(abs);
		writeEntry(abs, prior);
	}
	pruneCreatedDirectories(resolvedRoot, before, changes);
};
