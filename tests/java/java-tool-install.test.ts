import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import definitions from "../../scripts/java-tools.json";
import { installJavaTools } from "../../scripts/install-java-tools.mjs";

const downloads = vi.hoisted(() => ({ downloadFile: vi.fn(), digestOf: vi.fn() }));
vi.mock("../../scripts/tool-downloads.mjs", () => downloads);
let root: string;

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "aislop-java-install-"));
	downloads.downloadFile.mockReset();
	downloads.digestOf.mockReset();
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
	vi.restoreAllMocks();
	fs.rmSync(root, { recursive: true, force: true });
});

describe("Java tool installer", () => {
	it("preserves an existing install and removes staging on checksum mismatch", async () => {
		const directory = path.join(root, "tools", "java");
		const destination = path.join(directory, "google-java-format-2.0.0");
		fs.mkdirSync(destination, { recursive: true });
		fs.writeFileSync(path.join(destination, "old.jar"), "previous verified artifact");
		downloads.downloadFile.mockImplementation(async (_url: string, file: string) => fs.writeFileSync(file, "tampered"));
		downloads.digestOf.mockResolvedValue("wrong-checksum");
		await expect(installJavaTools(root)).rejects.toThrow("SHA-256 mismatch");
		expect(fs.readFileSync(path.join(destination, "old.jar"), "utf8")).toBe("previous verified artifact");
		expect(fs.readdirSync(directory)).toEqual(["google-java-format-2.0.0"]);
	});

	it("promotes verified jars and the complete PMD library directory", async () => {
		downloads.downloadFile.mockImplementation(async (_url: string, file: string) => {
			if (file.endsWith(".zip")) {
				const zip = new AdmZip();
				zip.addFile(definitions.pmd.entry, Buffer.from("PMD test fixture"));
				zip.addFile("pmd-bin-7.29.0/lib/dependency.jar", Buffer.from("dependency fixture"));
				zip.writeZip(file);
			} else fs.writeFileSync(file, "JAR test fixture");
		});
		downloads.digestOf.mockImplementation(async (file: string) => Object.values(definitions).find((tool) => file.endsWith(tool.asset))?.sha256);
		await installJavaTools(root);
		for (const [name, tool] of Object.entries(definitions)) {
			expect(fs.existsSync(path.join(root, "tools", "java", `${name}-${tool.version}`, tool.entry))).toBe(true);
		}
		expect(fs.existsSync(path.join(root, "tools/java/pmd-7.29.0/pmd-bin-7.29.0/lib/dependency.jar"))).toBe(true);
		expect(fs.readdirSync(path.join(root, "tools/java"))).toHaveLength(3);
	});
});
