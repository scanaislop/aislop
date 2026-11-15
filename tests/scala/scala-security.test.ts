import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectRiskyConstructs } from "../../src/engines/security/risky.js";
import type { EngineContext } from "../../src/engines/types.js";

let root: string;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-scala-security-"));
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

const scan = async (source: string): Promise<string[]> => {
	const file = path.join(root, "src", "Repo.scala");
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
	return (await detectRiskyConstructs(context)).map((d) => `${d.rule}:${d.line}`);
};

describe("Scala risky constructs", () => {
	it("flags SQL built by interpolation or concatenation", async () => {
		const findings = await scan(
			[
				"class Repo {",
				'  def a(st: Statement, id: String) = st.executeQuery(s"SELECT * FROM t WHERE id = $id")',
				'  def b(st: Statement, id: String) = st.executeQuery("SELECT * FROM t WHERE id = " + id)',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["security/sql-injection:2", "security/sql-injection:3"]);
	});

	it("leaves parameterized queries alone", async () => {
		const findings = await scan(
			[
				"class Repo {",
				'  def a(c: Connection) = c.prepareStatement("SELECT * FROM t WHERE id = ?")',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual([]);
	});

	it("flags shell commands built from interpolated strings", async () => {
		const findings = await scan(
			[
				"class Runner {",
				'  def a(dir: String) = scala.sys.process.Process(s"ls $dir")',
				'  def b(dir: String) = scala.sys.process.Process(Seq("ls", dir))',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["security/shell-injection:2"]);
	});

	it("flags Java deserialization entry points", async () => {
		const findings = await scan(
			[
				"class Loader {",
				"  def a(in: InputStream) = new ObjectInputStream(in).readObject()",
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["security/unsafe-deserialization:2"]);
	});
});
