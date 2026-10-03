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
		expect(expandBraceLists("file{1..3}.cs")).toEqual(["file{1..3}.cs"]);
		expect(expandBraceLists("\\{a,b}")).toEqual(["\\{a,b}"]);
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
