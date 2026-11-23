import { readFileSync } from "node:fs";

const [pack] = JSON.parse(readFileSync(0, "utf8"));
const files = new Map(pack.files.map((file) => [file.path, file]));
if (!files.has("tools/python/LICENSE")) throw new Error("Missing Python engine license");

for (const platform of ["darwin", "linux", "win32"]) {
	for (const arch of ["arm64", "x64"]) {
		const name = platform === "win32" ? "aislop-python.exe" : "aislop-python";
		const path = `tools/python/${platform}-${arch}/${name}`;
		const file = files.get(path);
		if (!file?.size || (platform !== "win32" && !(file.mode & 0o111))) {
			throw new Error(`Missing or non-executable Python engine: ${path}`);
		}
	}
}
