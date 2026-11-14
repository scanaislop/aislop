import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { JvmSecuritySchema } from "../src/config/schema.js";
import { fixScalaFormat, runScalaFormat } from "../src/engines/format/scala-format.js";
import { runJvmSpotbugs } from "../src/engines/security/jvm-tools.js";
import type { EngineContext } from "../src/engines/types.js";
import { runSubprocess } from "../src/utils/subprocess.js";
import { resolveJavaToolInvocation } from "../src/utils/tooling.js";

describe.runIf(process.env.AISLOP_JVM_INTEGRATION === "1")("real JVM tools", () => {
	let root: string;
	let context: EngineContext;
	const libraryDirectory = process.env.AISLOP_SCALA_COMPILER_LIB;
	const compilerClasspath = libraryDirectory
		? fs
				.readdirSync(libraryDirectory)
				.filter((name) => name.endsWith(".jar"))
				.map((name) => path.join(libraryDirectory, name))
				.join(path.delimiter)
		: "";
	let oldFormatterClasspath: string | undefined;
	const config = JvmSecuritySchema.parse({ spotbugs: true });
	it("starts the real Dependency-Check JVM entry point", async () => {
		const tool = resolveJavaToolInvocation("dependency-check");
		const result = await runSubprocess(tool.command, [...tool.args, "--version"]);
		expect(result.exitCode, result.stderr).toBe(0);
		expect(result.stdout).toContain("13.0.0");
	});
	beforeAll(() => {
		if (!libraryDirectory)
			throw new Error(
				"AISLOP_SCALA_COMPILER_LIB must point to the pinned Maven fixture dependencies",
			);
		root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop JVM live "));
		fs.mkdirSync(path.join(root, "src"));
		fs.mkdirSync(path.join(root, "target/classes"), { recursive: true });
		fs.writeFileSync(path.join(root, "pom.xml"), "<project/>");
		fs.cpSync(libraryDirectory, path.join(root, "lib"), { recursive: true });
		oldFormatterClasspath = process.env.AISLOP_SCALAFMT_CLASSPATH;
		process.env.AISLOP_SCALAFMT_CLASSPATH = compilerClasspath;
		context = {
			rootDirectory: root,
			languages: ["java"],
			frameworks: [],
			files: [],
			installedTools: {},
			config: {
				quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
				lint: { typecheck: false, expoDoctor: false },
				security: { audit: false, auditTimeout: 25000 },
				allowJvmExecution: true,
			},
		};
	});
	afterAll(() => {
		if (root) fs.rmSync(root, { recursive: true, force: true });
		if (oldFormatterClasspath === undefined) delete process.env.AISLOP_SCALAFMT_CLASSPATH;
		else process.env.AISLOP_SCALAFMT_CLASSPATH = oldFormatterClasspath;
	});
	it.each([8, 17, 21])(
		"finds real Java %s bytecode bugs and security warnings",
		async (release) => {
			fs.writeFileSync(
				path.join(root, "src/Unsafe.java"),
				'import java.security.MessageDigest; public class Unsafe { public static int length() { String x = null; return x.length(); } public static byte[] hash(byte[] x) throws Exception { return MessageDigest.getInstance("MD5").digest(x); } }',
			);
			context.files = ["src/Unsafe.java"];
			const build = await runSubprocess("javac", [
				"--release",
				String(release),
				"-g",
				"-d",
				path.join(root, "target/classes"),
				path.join(root, "src/Unsafe.java"),
			]);
			expect(build.exitCode, build.stderr).toBe(0);
			const diagnostics = await runJvmSpotbugs(context, config);
			expect(diagnostics.map((item) => item.rule)).toEqual(
				expect.arrayContaining(["spotbugs/NP_ALWAYS_NULL", "spotbugs/WEAK_MESSAGE_DIGEST_MD5"]),
			);
			expect(diagnostics.some((item) => item.rule === "security/jvm-analysis-failed")).toBe(false);
		},
		120000,
	);
	it.each([
		[
			"Scala 2",
			"scala.tools.nsc.Main",
			'object UnsafeScala { def hash(x: Array[Byte]): Array[Byte] = java.security.MessageDigest.getInstance("MD5").digest(x) }',
		],
		[
			"Scala 3",
			"dotty.tools.dotc.Main",
			'object UnsafeScala:\n  def hash(x: Array[Byte]): Array[Byte] =\n    java.security.MessageDigest.getInstance("MD5").digest(x)\n',
		],
	])(
		"finds security issues in compiled %s",
		async (_name, compiler, source) => {
			fs.rmSync(path.join(root, "target/classes"), { recursive: true });
			fs.mkdirSync(path.join(root, "target/classes"));
			fs.writeFileSync(path.join(root, "src/UnsafeScala.scala"), source);
			context.files = ["src/UnsafeScala.scala"];
			context.languages = ["scala"];
			const build = await runSubprocess(
				"java",
				[
					"-cp",
					compilerClasspath,
					compiler,
					"-classpath",
					compilerClasspath,
					"-d",
					path.join(root, "target/classes"),
					path.join(root, "src/UnsafeScala.scala"),
				],
				{ timeout: 120000 },
			);
			expect(build.exitCode, build.stderr).toBe(0);
			const diagnostics = await runJvmSpotbugs(context, { ...config, dependencies: ["lib"] });
			expect(diagnostics).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						rule: "spotbugs/WEAK_MESSAGE_DIGEST_MD5",
						filePath: "src/UnsafeScala.scala",
					}),
				]),
			);
			expect(diagnostics.some((item) => item.rule === "security/jvm-analysis-failed")).toBe(false);
		},
		120000,
	);
	it("formats Scala 3 with the real scalafmt CLI and verifies a second scan is clean", async () => {
		fs.writeFileSync(
			path.join(root, ".scalafmt.conf"),
			'version = "3.9.10"\nrunner.dialect = scala3\n',
		);
		fs.writeFileSync(
			path.join(root, "src/Format.scala"),
			"object Format{def add(x:Int,y:Int)=x+y}\n",
		);
		context.files = ["src/Format.scala"];
		const diagnostics = await runScalaFormat(context);
		expect(diagnostics).toEqual([
			expect.objectContaining({ rule: "scala-formatting", fixable: true }),
		]);
		await fixScalaFormat(context);
		expect(await runScalaFormat(context)).toEqual([]);
	}, 120000);
});
