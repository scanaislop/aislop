import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Diagnostic, EngineName } from "../engines/types.js";
import {
	BASELINE_VERSION,
	type Baseline,
	type BaselineEntry,
	sortEntries,
} from "./baseline-file.js";

export interface BaselineMatch {
	diagnostics: Diagnostic[];
	accepted: number;
	newFindings: number;
	stale: BaselineEntry[];
	staleCount: number;
}

interface MatchInput {
	baseline: Baseline;
	diagnostics: Diagnostic[];
	rootDirectory: string;
	scopeFiles: Set<string> | null;
	staleEngines: Set<EngineName>;
}

const toProjectPath = (rootDirectory: string, filePath: string): string => {
	const posix = filePath.replaceAll("\\", "/");
	if (!path.isAbsolute(filePath) && !path.posix.isAbsolute(posix)) return posix;
	return path.relative(rootDirectory, filePath).replaceAll("\\", "/");
};

const createLineReader = (rootDirectory: string) => {
	const cache = new Map<string, string[]>();
	return (file: string, line: number): string => {
		let lines = cache.get(file);
		if (!lines) {
			try {
				lines = fs.readFileSync(path.join(rootDirectory, file), "utf-8").split(/\r?\n/);
			} catch {
				lines = [];
			}
			cache.set(file, lines);
		}
		return lines[line - 1] ?? "";
	};
};

const fingerprintOf = (text: string): string =>
	createHash("sha256").update(text.trim().replace(/\s+/g, " ")).digest("hex").slice(0, 16);

interface Keyed {
	diagnostic: Diagnostic;
	key: string;
	entry: Omit<BaselineEntry, "count">;
}

const keyOf = (entry: Pick<BaselineEntry, "rule" | "file" | "fingerprint">): string =>
	`${entry.rule}\u0000${entry.file}\u0000${entry.fingerprint}`;

const keyDiagnostics = (diagnostics: Diagnostic[], rootDirectory: string): Keyed[] => {
	const readLine = createLineReader(rootDirectory);
	return diagnostics.map((diagnostic) => {
		const file = toProjectPath(rootDirectory, diagnostic.filePath);
		const fingerprint = diagnostic.line > 0 ? fingerprintOf(readLine(file, diagnostic.line)) : "";
		const entry = { rule: diagnostic.rule, engine: diagnostic.engine, file, fingerprint };
		return { diagnostic, key: keyOf(entry), entry };
	});
};

export const buildBaseline = (diagnostics: Diagnostic[], rootDirectory: string): Baseline => {
	const entries = new Map<string, BaselineEntry>();
	for (const { key, entry } of keyDiagnostics(diagnostics, rootDirectory)) {
		const existing = entries.get(key);
		if (existing) existing.count += 1;
		else entries.set(key, { ...entry, count: 1 });
	}
	return { version: BASELINE_VERSION, entries: sortEntries([...entries.values()]) };
};

export const matchBaseline = (input: MatchInput): BaselineMatch => {
	const remaining = new Map<string, number>();
	for (const entry of input.baseline.entries) {
		remaining.set(keyOf(entry), (remaining.get(keyOf(entry)) ?? 0) + entry.count);
	}
	let accepted = 0;
	const diagnostics = keyDiagnostics(input.diagnostics, input.rootDirectory).map(
		({ diagnostic, key }) => {
			const left = remaining.get(key) ?? 0;
			if (left === 0) return diagnostic;
			remaining.set(key, left - 1);
			accepted += 1;
			return { ...diagnostic, baselined: true };
		},
	);
	const stale: BaselineEntry[] = [];
	for (const entry of input.baseline.entries) {
		const key = keyOf(entry);
		const left = Math.min(remaining.get(key) ?? 0, entry.count);
		if (left === 0) continue;
		remaining.set(key, (remaining.get(key) ?? 0) - left);
		if (input.scopeFiles && !input.scopeFiles.has(entry.file)) continue;
		if (!input.staleEngines.has(entry.engine)) continue;
		stale.push({ ...entry, count: left });
	}
	return {
		diagnostics,
		accepted,
		newFindings: diagnostics.length - accepted,
		stale,
		staleCount: stale.reduce((sum, entry) => sum + entry.count, 0),
	};
};

export const pruneBaseline = (baseline: Baseline, match: BaselineMatch): Baseline => {
	const staleByKey = new Map(match.stale.map((entry) => [keyOf(entry), entry.count]));
	const entries = baseline.entries
		.map((entry) => ({ ...entry, count: entry.count - (staleByKey.get(keyOf(entry)) ?? 0) }))
		.filter((entry) => entry.count > 0);
	return { version: BASELINE_VERSION, entries: sortEntries(entries) };
};
