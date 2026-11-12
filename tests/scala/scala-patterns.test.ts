import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectScalaPatterns } from "../../src/engines/ai-slop/scala-patterns.js";
import type { EngineContext } from "../../src/engines/types.js";

let root: string;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-scala-patterns-"));
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

const scan = async (relative: string, source: string): Promise<string[]> => {
	const file = path.join(root, relative);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, source);
	const context: EngineContext = {
		rootDirectory: root,
		languages: ["scala"],
		frameworks: [],
		files: [file],
		installedTools: {},
		config: {
			quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
			security: { audit: false, auditTimeout: 0 },
		},
	};
	return (await detectScalaPatterns(context)).map((d) => `${d.rule}:${d.line}`);
};

const MAIN = "src/main/scala/app/Service.scala";

describe("Scala imports", () => {
	it("flags unused and duplicate imports across plain, selector, and renamed forms", async () => {
		const findings = await scan(
			MAIN,
			[
				"package app",
				"import java.util.List",
				"import java.util.Map",
				"import java.util.List",
				"import scala.collection.mutable.{ArrayBuffer, HashSet}",
				"import scala.concurrent.{Future => F}",
				"",
				"class Service {",
				"  val m: Map[String, Int] = Map.empty",
				"  val f: F[Unit] = ???",
				"}",
			].join("\n"),
		);
		expect(findings.sort()).toEqual(
			[
				"ai-slop/duplicate-import:4",
				"ai-slop/unused-import:2",
				"ai-slop/unused-import:5",
				"ai-slop/unused-import:5",
			].sort(),
		);
	});

	it("does not flag used imports, wildcards, or Scaladoc references", async () => {
		const findings = await scan(
			MAIN,
			[
				"package app",
				"import scala.collection.mutable._",
				"import scala.collection.immutable.*",
				"import scala.util.Try",
				"",
				"/** Works with [[Try]] results. */",
				"class Service {",
				"  val t = Try(1)",
				"}",
			].join("\n"),
		);
		expect(findings).toEqual([]);
	});
});

describe("Scala console leftovers", () => {
	it("flags println in production code", async () => {
		const findings = await scan(
			MAIN,
			["package app", "", "class Service {", '  def run(): Unit = println("debug")', "}"].join("\n"),
		);
		expect(findings).toEqual(["ai-slop/console-leftover:4"]);
	});

	it("leaves entry points and tests alone", async () => {
		const main = await scan(
			MAIN,
			["package app", "", "object Main {", '  def main(args: Array[String]): Unit = println("hi")', "}"].join(
				"\n",
			),
		);
		expect(main).toEqual([]);
		const test = await scan(
			"src/test/scala/app/ServiceSpec.scala",
			["package app", "", "class ServiceSpec {", '  def check(): Unit = println("debug")', "}"].join("\n"),
		);
		expect(test).toEqual([]);
	});
});

describe("Scala catches", () => {
	it("flags catches that only print or discard the exception", async () => {
		const findings = await scan(
			MAIN,
			[
				"package app",
				"import java.io.IOException",
				"",
				"class Service {",
				"  def load(): Unit =",
				"    try { risky() } catch { case e: IOException => e.printStackTrace() }",
				"  def save(): Unit =",
				"    try { risky() } catch { case _: IllegalStateException => () }",
				"}",
			].join("\n"),
		);
		expect(findings.sort()).toEqual(
			["ai-slop/swallowed-exception:6", "ai-slop/swallowed-exception:8"].sort(),
		);
	});

	it("does not flag catches that handle or rethrow", async () => {
		const findings = await scan(
			MAIN,
			[
				"package app",
				"import java.io.IOException",
				"",
				"class Service {",
				"  def load(): Unit =",
				"    try { risky() } catch { case e: IOException => throw new LoadFailed(e) }",
				"}",
			].join("\n"),
		);
		expect(findings).toEqual([]);
	});

	it("flags broad catches but exempts rethrowing ones", async () => {
		const findings = await scan(
			MAIN,
			[
				"package app",
				"",
				"class Service {",
				"  def a(): Int =",
				"    try { risky() } catch { case _: Throwable => -1 }",
				"  def b(): Int =",
				"    try { risky() } catch { case e: Exception => throw e }",
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["ai-slop/scala-broad-catch:5"]);
	});
});
