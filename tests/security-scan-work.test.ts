import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectRiskyConstructs } from "../src/engines/security/risky.js";
import { scanSecrets } from "../src/engines/security/secrets.js";
import type { EngineContext } from "../src/engines/types.js";

let rootDirectory: string;
beforeEach(() => {
	rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-security-work-"));
});
afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(rootDirectory, { recursive: true, force: true });
});

const context = (file: string): EngineContext => ({
	rootDirectory,
	files: [file],
	languages: ["typescript"],
	frameworks: [],
	installedTools: {},
	config: {
		quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
		security: { audit: false, auditTimeout: 25000 },
	},
});

describe("security diagnostic location work", () => {
	it.each([
		{ name: "secrets", scan: scanSecrets, statement: 'const key = "AKIA1234567890ABCDEF";' },
		{ name: "risky constructs", scan: detectRiskyConstructs, statement: 'eval("input");' },
	])("does not repeatedly split source prefixes for $name", async ({ scan, statement }) => {
		const source = `${statement}\n`.repeat(500);
		const file = path.join(rootDirectory, "source.ts");
		fs.writeFileSync(file, source);
		const split = String.prototype.split;
		let splitCharacters = 0;
		vi.spyOn(String.prototype, "split").mockImplementation(function (
			this: string,
			separator: string | RegExp,
			limit?: number,
		) {
			if (separator === "\n") splitCharacters += this.length;
			return split.call(this, separator, limit);
		});
		const findings = await scan(context(file));
		vi.restoreAllMocks();
		expect(findings.map((finding) => finding.line)).toEqual(
			Array.from({ length: 500 }, (_, index) => index + 1),
		);
		expect(splitCharacters).toBeLessThanOrEqual(source.length * 4);
	});

	it("preserves positions across patterns, CRLF, blank lines, unicode and EOF", async () => {
		const file = path.join(rootDirectory, "source.ts");
		fs.writeFileSync(
			file,
			[
				'const label = "😀"; eval("a"); eval("b");',
				"",
				'const password = "x7Q!m2Z#v9R";',
				'const key = "AKIA1234567890ABCDEF";',
				'new Function("body");',
			].join("\r\n"),
		);
		expect((await scanSecrets(context(file))).map(({ line }) => line)).toEqual([4, 3]);
		expect((await detectRiskyConstructs(context(file))).map(({ line }) => line)).toEqual([1, 1, 5]);
	});
});
