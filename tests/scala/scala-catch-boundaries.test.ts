import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectScalaPatterns } from "../../src/engines/ai-slop/scala-patterns.js";

let root: string;
beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-scala-catches-"));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const scan = async (source: string) => {
	const file = path.join(root, "Service.scala");
	fs.writeFileSync(file, source);
	const diagnostics = await detectScalaPatterns({
		rootDirectory: root,
		languages: ["scala"],
		frameworks: [],
		files: [file],
		installedTools: {},
		config: {
			quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
			security: { audit: false, auditTimeout: 0 },
		},
	});
	return diagnostics
		.filter((item) =>
			["ai-slop/swallowed-exception", "ai-slop/scala-broad-catch"].includes(item.rule),
		)
		.map(({ rule, line }) => ({ rule, line }));
};

describe("Scala catch clause boundaries", () => {
	it("does not mistake braced nested match cases for exception handlers", async () => {
		expect(
			await scan(
				"object Service { def load(reason: Throwable) = try work() catch { case e: java.io.IOException => reason match { case _: Throwable => recover(e) } } }",
			),
		).toEqual([]);
	});
	it("does not mistake indented nested match cases inside braced catches for handlers", async () => {
		expect(
			await scan(
				[
					"object Service:",
					"  def load(reason: Throwable) =",
					"    try work() catch {",
					"      case e: java.io.IOException =>",
					"        reason match",
					"          case _: Throwable => recover(e)",
					"      case e: IllegalStateException => recover(e)",
					"    }",
				].join("\n"),
			),
		).toEqual([]);
	});
	it("reports a discarded clause even when another clause handles its exception", async () => {
		expect(
			await scan(
				"object Service { def load() = try work() catch { case _: java.io.IOException => (); case e: IllegalStateException => recover(e) } }",
			),
		).toEqual([{ rule: "ai-slop/swallowed-exception", line: 1 }]);
	});
	it.each(["{ () }", "({ () })", "{{ (); }; }", '{ println(\n  "ignored"\n) }'])(
		"recognizes wrapped discarded handler %s",
		async (body) => {
			expect(
				await scan(
					`object Service { def load() = try work() catch { case _: java.io.IOException => ${body} } }`,
				),
			).toEqual([{ rule: "ai-slop/swallowed-exception", line: 1 }]);
		},
	);
	it("supports multiline guards and ignores function arrows inside a guard", async () => {
		expect(
			await scan(
				[
					"object Service:",
					"  def load() = try work()",
					"    catch",
					"      case e: java.io.IOException",
					"        if List(1).exists(n => n > 0) =>",
					"          ()",
				].join("\n"),
			),
		).toEqual([{ rule: "ai-slop/swallowed-exception", line: 3 }]);
	});
	it("reports nested discarded catches on their own line", async () => {
		expect(
			await scan(
				[
					"object Service:",
					"  def load() = try work() catch {",
					"    case outer: java.io.IOException =>",
					"      try work() catch { case _: IllegalStateException => () }",
					"      recover(outer)",
					"  }",
				].join("\n"),
			),
		).toEqual([{ rule: "ai-slop/swallowed-exception", line: 4 }]);
	});
	it("keeps real recovery and finally bodies outside discarded clauses", async () => {
		expect(
			await scan(
				[
					"object Service:",
					"  def load() =",
					"    try work()",
					"    catch",
					"      case e: java.io.IOException => { recover(e) }",
					"    finally cleanup()",
				].join("\n"),
			),
		).toEqual([]);
	});
	it("keeps a braced handler inside an indentation-based catch through its closing brace", async () => {
		expect(
			await scan(
				[
					"object Service:",
					"  def load() =",
					"    try work()",
					"    catch",
					"      case _: java.io.IOException => {",
					"        ()",
					"      }",
					"    finally cleanup()",
				].join("\n"),
			),
		).toEqual([{ rule: "ai-slop/swallowed-exception", line: 4 }]);
	});
});
