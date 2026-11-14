import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { JvmSecuritySchema } from "../src/config/schema.js";
import { runJvmDependencyCheck } from "../src/engines/security/jvm-tools.js";
import type { EngineContext } from "../src/engines/types.js";

describe.runIf(process.env.AISLOP_JVM_DEPENDENCY_INTEGRATION === "1")(
	"real JVM dependency audit",
	() => {
		let root: string;
		beforeAll(async () => {
			if (!process.env.AISLOP_NVD_DATA)
				throw new Error("AISLOP_NVD_DATA must point to a populated Dependency-Check cache");
			root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop JVM dependency "));
			fs.mkdirSync(path.join(root, "lib"));
			const response = await fetch(
				"https://repo.maven.apache.org/maven2/org/apache/logging/log4j/log4j-core/2.14.1/log4j-core-2.14.1.jar",
			);
			if (!response.ok) throw new Error(`Fixture download failed: ${response.status}`);
			const jar = Buffer.from(await response.arrayBuffer());
			expect(createHash("sha256").update(jar).digest("hex")).toBe(
				"ade7402a70667a727635d5c4c29495f4ff96f061f12539763f6f123973b465b0",
			);
			fs.writeFileSync(path.join(root, "lib/log4j-core-2.14.1.jar"), jar);
		}, 120000);
		afterAll(() => {
			if (root) fs.rmSync(root, { recursive: true, force: true });
		});
		it.each(["java", "scala"] as const)(
			"reports the real vulnerable JAR for %s projects",
			async (language) => {
				const manifest = language === "java" ? "pom.xml" : "build.sbt";
				fs.rmSync(path.join(root, "pom.xml"), { force: true });
				fs.writeFileSync(
					path.join(root, manifest),
					language === "java" ? "<project/>" : 'scalaVersion := "3.3.7"',
				);
				const context: EngineContext = {
					rootDirectory: root,
					languages: [language],
					frameworks: [],
					files: [],
					installedTools: {},
					config: {
						quality: { maxFunctionLoc: 80, maxFileLoc: 400, maxNesting: 5, maxParams: 6 },
						lint: { typecheck: false, expoDoctor: false },
						security: { audit: true, auditTimeout: 25000 },
						allowJvmExecution: true,
					},
				};
				const config = JvmSecuritySchema.parse({
					dependencies: ["lib"],
					dataDirectory: process.env.AISLOP_NVD_DATA,
					timeout: 120000,
				});
				const diagnostics = await runJvmDependencyCheck(context, config);
				expect(diagnostics).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							rule: "security/vulnerable-dependency",
							filePath: manifest,
							severity: "error",
							message: expect.stringContaining("CVE-2021-44228"),
						}),
					]),
				);
				expect(diagnostics.some((item) => item.rule === "security/jvm-analysis-failed")).toBe(
					false,
				);
			},
			120000,
		);
	},
);
