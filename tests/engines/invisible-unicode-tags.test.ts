import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scanInvisibleUnicodeTags } from "../../src/engines/security/invisible-unicode.js";
import type { EngineContext } from "../../src/engines/types.js";

let tmpDir: string;

const makeContext = (files?: string[]): EngineContext => ({
	rootDirectory: tmpDir,
	languages: ["typescript", "python"],
	frameworks: ["none"],
	...(files === undefined ? {} : { files }),
	installedTools: {},
	config: {
		quality: {
			maxFunctionLoc: 80,
			maxFileLoc: 400,
			maxNesting: 4,
			maxParams: 6,
		},
		security: { audit: true, auditTimeout: 25000 },
	},
});

const writeFile = (filename: string, content: string): string => {
	const filePath = path.join(tmpDir, filename);
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content, "utf-8");
	return filePath;
};

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-unicode-tags-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("security/invisible-unicode-tags", () => {
	it("flags raw Unicode tag characters in a comment and a string", async () => {
		const tagChar1 = String.fromCodePoint(0xe0001);
		const tagChar2 = String.fromCodePoint(0xe0020);
		const filePath = writeFile(
			"smuggled.ts",
			`// Normal looking comment${tagChar1}hidden instruction\nconst x = "safe${tagChar2}string";`,
		);

		const diagnostics = await scanInvisibleUnicodeTags(makeContext([filePath]));
		expect(diagnostics).toHaveLength(2);
		expect(diagnostics[0]?.severity).toBe("error");
		expect(diagnostics[0]?.category).toBe("Security");
		expect(diagnostics.every((d) => !/inside this system prompt/i.test(d.message))).toBe(true);
	});

	it("flags a JavaScript unicode escape and a Python unicode escape", async () => {
		const escapeFile = writeFile("escape.ts", 'const hidden = "\\u{E0001}secret";\n');
		const pyEscapeFile = writeFile("escape.py", 'hidden = "\\U000E0001secret"\n');

		const diagnostics = await scanInvisibleUnicodeTags(makeContext([escapeFile, pyEscapeFile]));
		expect(diagnostics).toHaveLength(2);
		expect(diagnostics.every((d) => !/inside this system prompt/i.test(d.message))).toBe(true);
	});

	it("uses a sharper message when a raw tag sits inside a system prompt string", async () => {
		const tagChar = String.fromCodePoint(0xe0001);
		const filePath = writeFile(
			"in-prompt.ts",
			`const messages = [{ role: "system", content: "hello${tagChar}there" }];\n`,
		);

		const diagnostics = await scanInvisibleUnicodeTags(makeContext([filePath]));
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toMatch(/inside this system prompt/i);
	});

	it("uses a sharper message when a raw tag sits inside a developer prompt string", async () => {
		const tagChar = String.fromCodePoint(0xe0001);
		const filePath = writeFile(
			"developer-prompt.ts",
			`const messages = [{ role: "developer", content: "hello${tagChar}there" }];\n`,
		);

		const diagnostics = await scanInvisibleUnicodeTags(makeContext([filePath]));
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toMatch(/inside this system prompt/i);
	});

	it("passes emoji, accents, and ZWJ sequences", async () => {
		const zwj = String.fromCodePoint(0x200d);
		const filePath = writeFile(
			"valid-unicode.ts",
			[
				'const greeting = "café crème 🚀 💡 Übergröße";',
				"// Comment with résumé and 日本語",
				`const family = "woman${zwj}man";`,
			].join("\n"),
		);

		const diagnostics = await scanInvisibleUnicodeTags(makeContext([filePath]));
		expect(diagnostics).toHaveLength(0);
	});

	it("passes a comment that only discusses tag characters", async () => {
		const filePath = writeFile(
			"comment-only.ts",
			"// Tag characters in the E0000 block are invisible and do not belong in source.\nconst ok = true;\n",
		);

		const diagnostics = await scanInvisibleUnicodeTags(makeContext([filePath]));
		expect(diagnostics).toHaveLength(0);
	});

	it("respects aislop-ignore suppression comments", async () => {
		const tagChar = String.fromCodePoint(0xe007f);
		const filePath = writeFile(
			"suppressed-tag.ts",
			`// aislop-ignore security/invisible-unicode-tags\nconst payload = "${tagChar}";`,
		);

		const diagnostics = await scanInvisibleUnicodeTags(makeContext([filePath]));
		expect(diagnostics).toHaveLength(0);
	});

	it("reports the rule through the security engine", async () => {
		const { securityEngine } = await import("../../src/engines/security/index.js");
		const tagChar = String.fromCodePoint(0xe0001);
		const filePath = writeFile("wired.ts", `const smuggled = "${tagChar}";\n`);

		const result = await securityEngine.run(makeContext([filePath]));
		expect(result.diagnostics.map((d) => d.rule)).toContain("security/invisible-unicode-tags");
	});
});
