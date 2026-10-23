import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runKnip } from "../src/engines/code-quality/knip.js";

let tmpDir: string;

const writeOrphanProject = (pkg: Record<string, unknown> = {}): void => {
	fs.mkdirSync(path.join(tmpDir, "src"), { recursive: true });
	fs.writeFileSync(
		path.join(tmpDir, "package.json"),
		JSON.stringify({ name: "demo", type: "module", main: "src/index.js", ...pkg }),
	);
	fs.writeFileSync(path.join(tmpDir, "src/index.js"), "export const used = 1;\n");
	fs.writeFileSync(path.join(tmpDir, "src/orphan.js"), "export const orphan = 1;\n");
};

const rules = (diagnostics: { rule: string; filePath: string }[]): string[] =>
	diagnostics.map((d) => `${d.rule} ${d.filePath}`);

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-knip-mode-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("quality.knip", () => {
	it("auto points at quality.knip: always when Knip is not set up", async () => {
		writeOrphanProject();

		const diagnostics = await runKnip(tmpDir, "auto");

		expect(rules(diagnostics)).toEqual(["knip/skipped package.json"]);
		expect(diagnostics[0].help).toContain("quality.knip: always");
	});

	it("always runs the bundled Knip without a declaration or config", async () => {
		writeOrphanProject();

		const found = rules(await runKnip(tmpDir, "always"));

		expect(found).toContain("knip/files src/orphan.js");
		expect(found.some((r) => r.startsWith("knip/skipped"))).toBe(false);
	});

	it("off never runs Knip and reports nothing, even when the project uses it", async () => {
		writeOrphanProject({ devDependencies: { knip: "^6.0.0" } });

		expect(await runKnip(tmpDir, "off")).toEqual([]);
	});

	it("reports a failed run as knip/skipped instead of a clean result", async () => {
		writeOrphanProject({ devDependencies: { knip: "^6.0.0" } });
		fs.writeFileSync(path.join(tmpDir, "knip.json"), "{ not json");

		const diagnostics = await runKnip(tmpDir, "auto");

		expect(rules(diagnostics)).toEqual(["knip/skipped package.json"]);
		expect(diagnostics[0].message).not.toContain("not set up");
	});
});
