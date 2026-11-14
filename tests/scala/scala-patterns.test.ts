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
	it("keeps imports in separate method and object scopes", async () => {
		const findings = await scan(
			MAIN,
			[
				"object First {",
				"  def one() = {",
				"    import scala.util.Try",
				"    Try(1)",
				"  }",
				"  def two() = {",
				"    import scala.util.Try",
				"    Try(2)",
				"  }",
				"}",
				"object Second:",
				"  import scala.util.Try",
				"  val value = Try(3)",
			].join("\n"),
		);
		expect(findings).toEqual([]);
	});

	it.each([
		"scala.concurrent.ExecutionContext.Implicits.global",
		"app.Runtime.executionContext",
		"app.Numeric.IntIsIntegral",
	])("preserves potentially implicit named import %s", async (imported) => {
		const findings = await scan(
			MAIN,
			`import scala.concurrent.Future\nimport ${imported}\nobject Work { val result = Future(42) }`,
		);
		expect(findings).toEqual([]);
	});

	it.each([
		's"${Instant.now()}"',
		's"$Instant"',
		's"""${Instant.now()}"""',
		'f"$Instant%s"',
		'raw"$Instant"',
		'custom"${Instant.now()}"',
	])("retains imports used only in %s", async (expression) => {
		const findings = await scan(
			MAIN,
			`import java.time.Instant\nobject Clock { val text = ${expression} }`,
		);
		expect(findings).toEqual([]);
	});

	it("still reports an import mentioned only in escaped or plain string text", async () => {
		const findings = await scan(
			MAIN,
			'import java.time.Instant\nobject Clock { val plain = "${Instant.now()}"; val escaped = s"$$Instant" }',
		);
		expect(findings).toEqual(["ai-slop/unused-import:1"]);
	});

	it("flags unused and duplicate imports across plain, selector, and renamed forms", async () => {
		const findings = await scan(
			MAIN,
			[
				"package app",
				"import java.util.List",
				"import java.util.Map",
				"import java.util.List",
				"import java.util.{ArrayList, HashSet}",
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
	it("keeps used Scala 3 aliases and implicit or hidden imports", async () => {
		const findings = await scan(
			MAIN,
			[
				"import scala.concurrent.Future as F",
				"import scala.collection.mutable.{Map as M, Set => _}",
				"import scala.math.Ordering.given",
				"import scala.math.Ordering.{given Ordering[Int]}",
				"class Service { val f: F[Int] = ???; val m: M[Int, Int] = ??? }",
			].join("\n"),
		);
		expect(findings).toEqual([]);
	});
});

describe("Scala console leftovers", () => {
	it("checks production code inside example-named JVM packages", async () => {
		const findings = await scan(
			"src/main/scala/com/example/Service.scala",
			'class Service { def run(): Unit = println("debug") }',
		);
		expect(findings).toEqual(["ai-slop/console-leftover:1"]);
	});

	it("flags println in production code", async () => {
		const findings = await scan(
			MAIN,
			["package app", "", "class Service {", '  def run(): Unit = println("debug")', "}"].join(
				"\n",
			),
		);
		expect(findings).toEqual(["ai-slop/console-leftover:4"]);
	});

	it("leaves entry points and tests alone", async () => {
		const main = await scan(
			MAIN,
			[
				"package app",
				"",
				"object Main {",
				'  def main(args: Array[String]): Unit = println("hi")',
				"}",
			].join("\n"),
		);
		expect(main).toEqual([]);
		const test = await scan(
			"src/test/scala/app/ServiceSpec.scala",
			[
				"package app",
				"",
				"class ServiceSpec {",
				'  def check(): Unit = println("debug")',
				"}",
			].join("\n"),
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


describe("Scala 3 catch layout", () => {
	it("finds swallowed and broad indentation-based catches", async () => {
		const findings = await scan(MAIN, [
			"object Service:",
			"  def load() =",
			"    try work()",
			"    catch",
			"      case _: Throwable => ()",
			"    logger.info(\"finished\")",
		].join("\n"));
		expect(findings).toEqual(["ai-slop/swallowed-exception:4", "ai-slop/scala-broad-catch:5"]);
	});

	it("stops a clause at dedent instead of borrowing a later rethrow", async () => {
		const findings = await scan(MAIN, [
			"object Service:",
			"  def load() =",
			"    try work()",
			"    catch",
			"      case _: Exception => ()",
			"    throw new IllegalStateException()",
		].join("\n"));
		expect(findings).toEqual(["ai-slop/swallowed-exception:4", "ai-slop/scala-broad-catch:5"]);
	});

	it("keeps nested match cases inside a rethrowing catch clause", async () => {
		const findings = await scan(MAIN, [
			"object Service:",
			"  def load() =",
			"    try work()",
			"    catch",
			"      case e: Exception =>",
			"        mode match",
			"          case Recover => recover(e)",
			"          case _ => throw e",
		].join("\n"));
		expect(findings).toEqual([]);
	});

	it("recognizes multiple clauses, comments, finally, and end markers", async () => {
		const findings = await scan(MAIN, [
			"object Service:",
			"  def load() =",
			"    try work()",
			"    catch",
			"      case _: IllegalStateException =>",
			"        // ignored",
			"        ()",
			"      case _: Throwable => ()",
			"    finally",
			"      cleanup()",
			"    end try",
		].join("\n"));
		expect(findings).toEqual(["ai-slop/swallowed-exception:4", "ai-slop/scala-broad-catch:8"]);
	});
});
