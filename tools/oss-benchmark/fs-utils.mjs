import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA_ROOT = path.join(PACKAGE_ROOT, "tools", "benchmark-data");
export const COHORTS_DIR = path.join(DATA_ROOT, "cohorts");
export const REPOS_DIR = path.join(DATA_ROOT, "repos");
export const RUNS_DIR = path.join(DATA_ROOT, "runs");

export const info = (message) => console.error(`[oss-benchmark] ${message}`);

export const toPosix = (value) => value.split(path.sep).join("/");

export const ensureDir = (directory) => {
	fs.mkdirSync(directory, { recursive: true });
};

export const writeJson = (filePath, value) => {
	ensureDir(path.dirname(filePath));
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

export const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

export const dateStamp = () => new Date().toISOString().slice(0, 10);

export const timestampStamp = () => new Date().toISOString().replace(/[:.]/g, "-");

export const slugify = (value) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "") || "run";

export const repoKey = (repo) => `${repo.owner}__${repo.name}`;

export const relativeToRoot = (filePath) => toPosix(path.relative(PACKAGE_ROOT, filePath));

export const dedupePath = (targetPath) => {
	if (!fs.existsSync(targetPath)) return targetPath;

	const directory = path.dirname(targetPath);
	const extension = path.extname(targetPath);
	const basename = extension ? path.basename(targetPath, extension) : path.basename(targetPath);
	let index = 2;

	while (true) {
		const candidate = path.join(directory, `${basename}-${index}${extension}`);
		if (!fs.existsSync(candidate)) return candidate;
		index += 1;
	}
};
