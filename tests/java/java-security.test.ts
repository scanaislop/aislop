import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectRiskyConstructs } from "../../src/engines/security/risky.js";
import type { EngineContext } from "../../src/engines/types.js";

let root: string;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-security-"));
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

const scan = async (source: string): Promise<string[]> => {
	const file = path.join(root, "src", "Repo.java");
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
	return (await detectRiskyConstructs(context)).map((d) => `${d.rule}:${d.line}`);
};

describe("Java risky constructs", () => {
	it("flags SQL built by concatenation or String.format", async () => {
		const findings = await scan(
			[
				"class Repo {",
				'  void a(Statement st, String id) { st.executeQuery("SELECT * FROM t WHERE id = " + id); }',
				'  void b(Connection c, String n) { c.prepareStatement(String.format("DELETE FROM %s", n)); }',
				'  void c(EntityManager em, String n) { em.createQuery("FROM User WHERE name = \'" + n + "\'"); }',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["security/sql-injection:2", "security/sql-injection:3", "security/sql-injection:4"]);
	});

	it("leaves parameterized queries alone", async () => {
		const findings = await scan(
			[
				"class Repo {",
				'  void a(Connection c, String id) { var ps = c.prepareStatement("SELECT * FROM t WHERE id = ?"); ps.setString(1, id); }',
				'  void b(EntityManager em) { em.createQuery("FROM User WHERE name = :name"); }',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual([]);
	});

	it("flags concatenated process commands but not argument lists", async () => {
		const findings = await scan(
			[
				"class Repo {",
				'  void a(String f) throws Exception { Runtime.getRuntime().exec("rm -rf " + f); }',
				'  void b(String f) { new ProcessBuilder("sh -c " + f); }',
				'  void c(String f) { new ProcessBuilder("rm", "-rf", f); }',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["security/shell-injection:2", "security/shell-injection:3"]);
	});

	it("flags ObjectInputStream and XMLDecoder deserialization", async () => {
		const findings = await scan(
			[
				"class Repo {",
				"  Object a(InputStream in) throws Exception { return new ObjectInputStream(in).readObject(); }",
				"  Object b(InputStream in) { return new java.beans.XMLDecoder(in).readObject(); }",
				'  String c() { return "new ObjectInputStream(in)"; }',
				"}",
			].join("\n"),
		);
		expect(findings).toEqual(["security/unsafe-deserialization:2", "security/unsafe-deserialization:3"]);
	});
});
