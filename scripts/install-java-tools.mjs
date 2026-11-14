import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import { digestOf, downloadFile } from "./tool-downloads.mjs";

const definitions = JSON.parse(
	fs.readFileSync(fileURLToPath(new URL("./java-tools.json", import.meta.url)), "utf8"),
);

export const installJavaTools = async (packageRoot) => {
	const directory = path.join(packageRoot, "tools", "java");
	fs.mkdirSync(directory, { recursive: true });
	for (const [name, tool] of Object.entries(definitions)) {
		const destination = path.join(directory, `${name}-${tool.version}`);
		const staging = fs.mkdtempSync(path.join(directory, `${name}-staging-`));
		try {
			console.error(`[aislop] Downloading ${name} ${tool.version}...`);
			const archive = path.join(staging, tool.asset);
			await downloadFile(tool.url, archive);
			if ((await digestOf(archive, "sha256", "hex")) !== tool.sha256) {
				throw new Error(`SHA-256 mismatch for ${name} ${tool.version}`);
			}
			if (tool.asset.endsWith(".zip")) {
				new AdmZip(archive).extractAllTo(staging, true);
				fs.rmSync(archive);
			}
			if (!fs.statSync(path.join(staging, tool.entry), { throwIfNoEntry: false })?.isFile()) {
				throw new Error(`Missing ${tool.entry} in verified ${name} archive`);
			}
			fs.rmSync(destination, { recursive: true, force: true });
			fs.renameSync(staging, destination);
			console.error(`[aislop] Installed ${name} ${tool.version}`);
		} finally {
			fs.rmSync(staging, { recursive: true, force: true });
		}
	}
	console.error("[aislop] Java tools installed. Keep JDK 21+ on PATH, then run aislop doctor.");
};
