import { describe, expect, it } from "vitest";
import { expandBraceLists, matchesGlobList } from "../../src/utils/globs.js";

describe("expandBraceLists", () => {
	it("expands comma lists in order", () => {
		expect(expandBraceLists("{Vendor,ThirdParty}/**")).toEqual(["Vendor/**", "ThirdParty/**"]);
	});

	it("expands nested and repeated lists", () => {
		expect(expandBraceLists("{a,b{c,d}}/{x,y}")).toEqual([
			"a/x",
			"a/y",
			"bc/x",
			"bc/y",
			"bd/x",
			"bd/y",
		]);
	});

	it("leaves patterns without a comma list unchanged", () => {
		expect(expandBraceLists("src/**/*.cs")).toEqual(["src/**/*.cs"]);
		expect(expandBraceLists("\\{a,b}")).toEqual(["\\{a,b}"]);
	});

	it("expands numeric and letter ranges, with steps and zero padding", () => {
		expect(expandBraceLists("Generated/File{1..3}.cs")).toEqual([
			"Generated/File1.cs",
			"Generated/File2.cs",
			"Generated/File3.cs",
		]);
		expect(expandBraceLists("v{3..1}")).toEqual(["v3", "v2", "v1"]);
		expect(expandBraceLists("{a..c}")).toEqual(["a", "b", "c"]);
		expect(expandBraceLists("{0..10..5}")).toEqual(["0", "5", "10"]);
		expect(expandBraceLists("part{08..10}")).toEqual(["part08", "part09", "part10"]);
		expect(expandBraceLists("File{1..3..01}.cs")).toEqual(["File01.cs", "File02.cs", "File03.cs"]);
		expect(expandBraceLists("{x..}")).toEqual(["{x..}"]);
	});

	it("leaves a range that is too large unexpanded", () => {
		expect(expandBraceLists("{1..100000}")).toEqual(["{1..100000}"]);
		expect(expandBraceLists("{9007199254740992..9007199254740993}")).toEqual([
			"{9007199254740992..9007199254740993}",
		]);
	});

	it("returns the pattern unexpanded when the expansion is too large", () => {
		const pattern = "{a,b}{a,b}{a,b}{a,b}{a,b}{a,b}{a,b}{a,b}{a,b}";
		expect(expandBraceLists(pattern)).toEqual([pattern]);
	});
});

describe("matchesGlobList", () => {
	it("matches positives minus negated patterns", () => {
		const globs = ["packages/*", "!packages/legacy"];
		expect(matchesGlobList("packages/api", globs)).toBe(true);
		expect(matchesGlobList("packages/legacy", globs)).toBe(false);
		expect(matchesGlobList("apps/web", globs)).toBe(false);
	});

	it("treats a list of only negations as matching everything else", () => {
		expect(matchesGlobList("src/a.ts", ["!**/*.test.ts"])).toBe(true);
		expect(matchesGlobList("src/a.test.ts", ["!**/*.test.ts"])).toBe(false);
	});

	it("passes options through to the matcher", () => {
		expect(matchesGlobList(".github/x.yml", ["**/*.yml"])).toBe(false);
		expect(matchesGlobList(".github/x.yml", ["**/*.yml"], { dot: true })).toBe(true);
	});
});
