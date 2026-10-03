import fs from "node:fs";
import path from "node:path";
import type { EngineName } from "../engines/types.js";

export const BASELINE_VERSION = 1;
const DEFAULT_BASELINE_PATH = ".aislop/baseline.json";

export interface BaselineEntry {
	rule: string;
	engine: EngineName;
	file: string;
	fingerprint: string;
	count: number;
}

export interface Baseline {
	version: typeof BASELINE_VERSION;
	entries: BaselineEntry[];
}

export type BaselineLoad =
	| { kind: "ok"; baseline: Baseline }
	| { kind: "missing" }
	| { kind: "invalid"; reason: string };

const compareEntries = (a: BaselineEntry, b: BaselineEntry): number =>
	a.file.localeCompare(b.file) ||
	a.rule.localeCompare(b.rule) ||
	a.fingerprint.localeCompare(b.fingerprint);

export const sortEntries = (entries: BaselineEntry[]): BaselineEntry[] =>
	[...entries].sort(compareEntries);

export const serializeBaseline = (baseline: Baseline): string =>
	`${JSON.stringify(
		{
			version: BASELINE_VERSION,
			entries: sortEntries(baseline.entries).map(({ rule, engine, file, fingerprint, count }) => ({
				rule,
				engine,
				file,
				fingerprint,
				count,
			})),
		},
		null,
		2,
	)}\n`;

const isEntry = (value: unknown): value is BaselineEntry => {
	if (!value || typeof value !== "object") return false;
	const entry = value as Record<string, unknown>;
	return (
		typeof entry.rule === "string" &&
		typeof entry.engine === "string" &&
		typeof entry.file === "string" &&
		typeof entry.fingerprint === "string" &&
		Number.isInteger(entry.count) &&
		(entry.count as number) > 0
	);
};

const parseBaseline = (raw: string): BaselineLoad => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { kind: "invalid", reason: "not valid JSON" };
	}
	if (!parsed || typeof parsed !== "object") return { kind: "invalid", reason: "not an object" };
	const { version, entries } = parsed as { version?: unknown; entries?: unknown };
	if (version !== BASELINE_VERSION) {
		return { kind: "invalid", reason: `unsupported version ${String(version)}` };
	}
	if (!Array.isArray(entries) || !entries.every(isEntry)) {
		return {
			kind: "invalid",
			reason: "entries must be a list of rule/engine/file/fingerprint/count",
		};
	}
	return { kind: "ok", baseline: { version: BASELINE_VERSION, entries } };
};

export const readBaseline = (filePath: string): BaselineLoad => {
	let raw: string;
	try {
		raw = fs.readFileSync(filePath, "utf-8");
	} catch {
		return { kind: "missing" };
	}
	return parseBaseline(raw);
};

export const writeBaseline = (filePath: string, baseline: Baseline): void => {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, serializeBaseline(baseline));
};

export const resolveBaselinePath = (rootDirectory: string, configured?: string): string =>
	path.resolve(rootDirectory, configured ?? DEFAULT_BASELINE_PATH);
