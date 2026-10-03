import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	readBaseline,
	serializeBaseline,
	writeBaseline,
} from "../src/baseline/baseline-file.js";
import { buildBaseline, matchBaseline, pruneBaseline } from "../src/baseline/match.js";
import { computeScanExitCode } from "../src/commands/scan-exit-code.js";
import type { Diagnostic, EngineName } from "../src/engines/types.js";

let root: string;

const writeSource = (relative: string, content: string): void => {
	const absolute = path.join(root, relative);
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	fs.writeFileSync(absolute, content);
};

const diag = (
	filePath: string,
	line: number,
	rule = "ai-slop/swallowed-exception",
	engine: EngineName = "ai-slop",
): Diagnostic => ({
	filePath,
	engine,
	rule,
	severity: "error",
	message: "m",
	help: "h",
	line,
	column: 1,
	category: "AI Slop",
	fixable: false,
});

const ALL_ENGINES = new Set<EngineName>(["ai-slop", "code-quality", "lint", "format", "security"]);

const match = (
	baseline: ReturnType<typeof buildBaseline>,
	diagnostics: Diagnostic[],
	scopeFiles: Set<string> | null = null,
	engines = ALL_ENGINES,
) => matchBaseline({ baseline, diagnostics, rootDirectory: root, scopeFiles, staleEngines: engines });

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-baseline-"));
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

describe("baseline matching", () => {
	it("keeps accepting a finding after unrelated lines shift it down", () => {
		writeSource("src/a.ts", "try {\n\trun();\n} catch {}\n");
		const baseline = buildBaseline([diag("src/a.ts", 3)], root);

		writeSource("src/a.ts", "import x from 'x';\n\n// note\ntry {\n\trun();\n} catch {}\n");
		const result = match(baseline, [diag("src/a.ts", 6)]);

		expect(result.accepted).toBe(1);
		expect(result.newFindings).toBe(0);
		expect(result.stale).toEqual([]);
		expect(result.diagnostics[0].baselined).toBe(true);
	});

	it("tolerates indentation changes on the reported line", () => {
		writeSource("src/a.ts", "} catch {}\n");
		const baseline = buildBaseline([diag("src/a.ts", 1)], root);
		writeSource("src/a.ts", "\t\t}   catch {}\n");

		expect(match(baseline, [diag("src/a.ts", 1)]).accepted).toBe(1);
	});

	it("counts duplicate findings so only the recorded number is accepted", () => {
		writeSource("src/a.ts", "} catch {}\n} catch {}\n} catch {}\n");
		const baseline = buildBaseline([diag("src/a.ts", 1), diag("src/a.ts", 2)], root);
		expect(baseline.entries).toEqual([
			expect.objectContaining({ file: "src/a.ts", count: 2 }),
		]);

		const result = match(baseline, [diag("src/a.ts", 1), diag("src/a.ts", 2), diag("src/a.ts", 3)]);
		expect(result.accepted).toBe(2);
		expect(result.newFindings).toBe(1);
		expect(result.diagnostics.map((d) => Boolean(d.baselined))).toEqual([true, true, false]);
	});

	it("reports a new finding on a different line as new", () => {
		writeSource("src/a.ts", "} catch {}\nconst x = 1;\n");
		const baseline = buildBaseline([diag("src/a.ts", 1)], root);

		const result = match(baseline, [diag("src/a.ts", 1), diag("src/a.ts", 2)]);
		expect(result.accepted).toBe(1);
		expect(result.newFindings).toBe(1);
	});

	it("matches file-level findings regardless of content changes", () => {
		writeSource("src/big.ts", "a\n");
		const baseline = buildBaseline([diag("src/big.ts", 0, "complexity/file-too-large", "code-quality")], root);
		writeSource("src/big.ts", "a\nb\nc\n");

		const result = match(baseline, [diag("src/big.ts", 0, "complexity/file-too-large", "code-quality")]);
		expect(result.accepted).toBe(1);
		expect(baseline.entries[0].fingerprint).toBe("");
	});

	it("reports entries that no longer occur as stale, with remaining counts", () => {
		writeSource("src/a.ts", "} catch {}\n} catch {}\n");
		writeSource("src/b.ts", "} catch {}\n");
		const baseline = buildBaseline(
			[diag("src/a.ts", 1), diag("src/a.ts", 2), diag("src/b.ts", 1)],
			root,
		);

		const result = match(baseline, [diag("src/a.ts", 1)]);
		expect(result.staleCount).toBe(2);
		expect(result.stale.map((entry) => [entry.file, entry.count])).toEqual([
			["src/a.ts", 1],
			["src/b.ts", 1],
		]);
	});

	it("does not report stale entries for files outside a scoped scan", () => {
		writeSource("src/a.ts", "} catch {}\n");
		writeSource("src/b.ts", "} catch {}\n");
		const baseline = buildBaseline([diag("src/a.ts", 1), diag("src/b.ts", 1)], root);

		const result = match(baseline, [], new Set(["src/a.ts"]));
		expect(result.stale.map((entry) => entry.file)).toEqual(["src/a.ts"]);
	});

	it("does not report stale entries for engines that did not fully run", () => {
		writeSource("src/a.ts", "} catch {}\n");
		const baseline = buildBaseline(
			[diag("src/a.ts", 1), diag("src/a.ts", 1, "python-formatting", "format")],
			root,
		);

		const result = match(baseline, [], null, new Set<EngineName>(["ai-slop"]));
		expect(result.stale.map((entry) => entry.rule)).toEqual(["ai-slop/swallowed-exception"]);
	});

	it("prunes stale entries and lowers counts without adding new findings", () => {
		writeSource("src/a.ts", "} catch {}\n} catch {}\nconst y = 2;\n");
		writeSource("src/b.ts", "} catch {}\n");
		const baseline = buildBaseline(
			[diag("src/a.ts", 1), diag("src/a.ts", 2), diag("src/b.ts", 1)],
			root,
		);

		const result = match(baseline, [diag("src/a.ts", 1), diag("src/a.ts", 3)]);
		const pruned = pruneBaseline(baseline, result);
		expect(pruned.entries.map((entry) => [entry.file, entry.count])).toEqual([["src/a.ts", 1]]);
	});

	it("normalizes absolute and backslash paths to project-relative posix", () => {
		writeSource("src/a.ts", "} catch {}\n");
		const baseline = buildBaseline([diag(path.join(root, "src", "a.ts"), 1)], root);
		expect(baseline.entries[0].file).toBe("src/a.ts");
		expect(match(baseline, [diag("src\\a.ts", 1)]).accepted).toBe(1);
	});
});

describe("baseline file", () => {
	it("serializes entries in a stable sorted order with a version", () => {
		writeSource("src/b.ts", "x\n");
		writeSource("src/a.ts", "y\n");
		const baseline = buildBaseline(
			[diag("src/b.ts", 1), diag("src/a.ts", 1, "z-rule"), diag("src/a.ts", 1, "a-rule")],
			root,
		);
		const parsed = JSON.parse(serializeBaseline(baseline));
		expect(parsed.version).toBe(1);
		expect(parsed.entries.map((e: { file: string; rule: string }) => `${e.file} ${e.rule}`)).toEqual([
			"src/a.ts a-rule",
			"src/a.ts z-rule",
			"src/b.ts ai-slop/swallowed-exception",
		]);
		expect(serializeBaseline(baseline).endsWith("\n")).toBe(true);
	});

	it("round-trips through disk and reports missing or invalid files", () => {
		writeSource("src/a.ts", "x\n");
		const file = path.join(root, ".aislop", "baseline.json");
		expect(readBaseline(file).kind).toBe("missing");

		writeBaseline(file, buildBaseline([diag("src/a.ts", 1)], root));
		const loaded = readBaseline(file);
		expect(loaded.kind).toBe("ok");
		if (loaded.kind === "ok") expect(loaded.baseline.entries).toHaveLength(1);

		fs.writeFileSync(file, "{not json");
		expect(readBaseline(file).kind).toBe("invalid");
		fs.writeFileSync(file, JSON.stringify({ version: 99, entries: [] }));
		expect(readBaseline(file).kind).toBe("invalid");
	});
});

describe("exit code with a baseline", () => {
	const base = { hasErrors: true, scoreable: true, score: 90, failBelow: 70 };

	it("passes when every error is baselined", () => {
		expect(computeScanExitCode({ ...base, newFindings: 0 })).toBe(0);
	});

	it("fails on any new finding, including warnings", () => {
		expect(computeScanExitCode({ ...base, hasErrors: false, newFindings: 1 })).toBe(1);
	});

	it("still fails below the score threshold", () => {
		expect(computeScanExitCode({ ...base, score: 50, newFindings: 0 })).toBe(1);
	});

	it("keeps the old behavior without a baseline", () => {
		expect(computeScanExitCode(base)).toBe(1);
		expect(computeScanExitCode({ ...base, hasErrors: false })).toBe(0);
	});
});
