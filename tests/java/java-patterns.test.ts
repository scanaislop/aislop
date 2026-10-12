import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectJavaPatterns } from "../../src/engines/ai-slop/java-patterns.js";
import type { EngineContext } from "../../src/engines/types.js";

let root: string;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-patterns-"));
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
		languages: ["java"],
		frameworks: [],
		files: [file],
		installedTools: {},
		config: {
			quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
			security: { audit: false, auditTimeout: 0 },
		},
	};
	return (await detectJavaPatterns(context)).map((d) => `${d.rule}:${d.line}`);
};

const MAIN = "src/main/java/app/Service.java";

describe("Java imports", () => {
	it("flags unused and duplicate imports, keeping code and Javadoc references", async () => {
		const findings = await scan(
			MAIN,
			[
				"package app;",
				"import java.util.List;",
				"import java.util.Map;",
				"import java.util.List;",
				"import java.util.Optional;",
				"import java.util.function.*;",
				"import static java.util.Objects.requireNonNull;",
				"",
				"/** Returns a {@link Optional}. */",
				"class Service {",
				"  List<String> names() { return requireNonNull(null); }",
				'  String label() { return "Map"; }',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["ai-slop/duplicate-import:4", "ai-slop/unused-import:3"]);
	});
});

describe("Java print leftovers and print-only catches", () => {
	it("flags prints and print-only catches in production code", async () => {
		const findings = await scan(
			MAIN,
			[
				"class Service {",
				"  void run() {",
				'    System.out.println("debug");',
				"    try { work(); } catch (IOException e) {",
				"      e.printStackTrace();",
				"    }",
				"    try { work(); } catch (IOException e) { throw new UncheckedIOException(e); }",
				"  }",
				"}",
			].join("\n"),
		);
		expect(findings).toEqual([
			"ai-slop/console-leftover:3",
			"ai-slop/swallowed-exception:4",
		]);
	});

	it("allows prints in classes with a main method and in tests", async () => {
		expect(
			await scan(MAIN, 'class Cli { public static void main(String[] a) { System.out.println("hi"); } }'),
		).toEqual([]);
		expect(
			await scan("src/test/java/app/ServiceTest.java", 'class ServiceTest { void t() { System.out.println("x"); } }'),
		).toEqual([]);
	});
});

describe("Java broad throws", () => {
	it("flags throws Exception and Throwable, but not specific or allowed cases", async () => {
		const findings = await scan(
			MAIN,
			[
				"class Service implements AutoCloseable, Callable<String> {",
				"  void load(String path) throws Exception {",
				"  }",
				"  void parse()",
				"      throws IOException, Throwable {",
				"  }",
				"  void read() throws IOException {",
				"  }",
				"  public void close() throws Exception {}",
				"  public String call() throws Exception { return null; }",
				"  public static void main(String[] args) throws Exception {}",
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["ai-slop/java-broad-throws:2", "ai-slop/java-broad-throws:5"]);
	});

	it("skips test classes", async () => {
		expect(
			await scan("src/test/java/app/ServiceTest.java", "class ServiceTest { void t() throws Exception {} }"),
		).toEqual([]);
	});
});
