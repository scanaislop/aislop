import { describe, expect, it } from "vitest";
import { maskComments, maskStringsAndComments } from "../../src/utils/source-masker.js";

describe("Scala source masking", () => {
	it("masks strings, chars, and comments while keeping code and line breaks", () => {
		const source = ['val s = "a { b" // trailing {', "val c = '{'", "/* block { */ val x = 1"].join(
			"\n",
		);
		const masked = maskStringsAndComments(source, ".scala");

		expect(masked.split("\n")).toHaveLength(3);
		expect(masked).not.toContain("{");
		expect(masked).toContain("val s =");
		expect(masked).toContain("val x = 1");
	});

	it("masks nested block comments to the matching close", () => {
		const source = "/* outer /* inner { */ still comment } */ val y = 2";
		const masked = maskStringsAndComments(source, ".scala");

		expect(masked).toContain("val y = 2");
		expect(masked).not.toContain("still comment");
		expect(masked).not.toContain("{");
	});

	it("masks triple-quoted strings, including embedded quotes and braces", () => {
		const source = ['val t = """a "quoted" { b"""', "val z = 3"].join("\n");
		const masked = maskStringsAndComments(source, ".scala");

		expect(masked).not.toContain("quoted");
		expect(masked).not.toContain("{");
		expect(masked).toContain("val z = 3");
	});

	it("does not treat a symbol literal as a char literal", () => {
		const source = ["val sym = 'name", 'val w = "visible"'].join("\n");
		const masked = maskStringsAndComments(source, ".scala");

		expect(masked).toContain("val w =");
		expect(masked).not.toContain("visible");
	});

	it("masks char literal bodies", () => {
		const masked = maskStringsAndComments("val c = 'Q'", ".scala");
		expect(masked).not.toContain("Q");
	});

	it("masks interpolated string bodies but keeps the prefix", () => {
		const masked = maskStringsAndComments('val q = s"SELECT $id"', ".scala");
		expect(masked).toContain('s"');
		expect(masked).not.toContain("SELECT");
	});
});

describe("Scala literal boundaries", () => {
	it("keeps comments inside strings and masks escaped character bodies", () => {
		const source = String.raw`val brace = '\u007b'; val url = "https://host/path"; // remove`;
		expect(maskStringsAndComments(source, ".scala")).not.toContain("u007b");
		expect(maskComments(source, ".sc")).toContain("https://host/path");
		expect(maskComments(source, ".scala")).not.toContain("remove");
	});
});

describe("Scala interpolation expressions", () => {
	it("preserves nested executable code while masking literal text and comments", () => {
		const source =
			'val text = s"outer ${ { val inner = s"nested ${Instant.now()}"; /* } comment */ inner } } tail"';
		const masked = maskStringsAndComments(source, ".scala");
		expect(masked).toContain("Instant.now()");
		expect(masked).toContain("val inner =");
		expect(masked).not.toContain("outer");
		expect(masked).not.toContain("nested");
		expect(masked).not.toContain("comment");
		expect(masked).not.toContain("tail");
		expect(masked.length).toBe(source.length);
	});

	it("keeps comment-only masking faithful to interpolation literal text", () => {
		const source = 'val text = s"https://host/${Instant.now() /* comment */}" // trailing';
		const masked = maskComments(source, ".scala");
		expect(masked).toContain('s"https://host/${Instant.now()');
		expect(masked).not.toContain("comment");
		expect(masked).not.toContain("trailing");
	});
});
