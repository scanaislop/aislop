import fs from "node:fs";
import path from "node:path";
import { getSourceFiles } from "../utils/source-files.js";
import type { EngineContext } from "./types.js";

const JAVA_EXTENSIONS = new Set([".java"]);
const BUILD_FILES = ["pom.xml", "build.gradle", "build.gradle.kts"];
const MAX_BUILD_FILE_BYTES = 1_048_576;

export type JavaFormatStyle = "google" | "aosp";

export const getJavaTargets = (context: EngineContext): string[] => {
	const files = context.files ?? getSourceFiles(context);
	const targets = files
		.filter((filePath) => JAVA_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
		.map((filePath) => {
			const absolutePath = path.isAbsolute(filePath)
				? filePath
				: path.resolve(context.rootDirectory, filePath);
			return path.relative(context.rootDirectory, absolutePath).split(path.sep).join("/");
		})
		.filter((filePath) => filePath.length > 0 && !filePath.startsWith(".."));
	return [...new Set(targets)];
};

const readBuildFile = (filePath: string): string => {
	try {
		const stat = fs.statSync(filePath);
		if (!stat.isFile() || stat.size > MAX_BUILD_FILE_BYTES) return "";
		return fs.readFileSync(filePath, "utf-8");
	} catch {
		return "";
	}
};

const GOOGLE_FORMAT_RE = /googleJavaFormat|google-java-format|fmt-maven-plugin/;
const AOSP_RE = /\.aosp\(\)|<style>\s*AOSP\s*<\/style>|--aosp/i;

export const detectJavaFormatStyle = (rootDirectory: string): JavaFormatStyle | null => {
	const content = BUILD_FILES.map((name) => readBuildFile(path.join(rootDirectory, name))).join(
		"\n",
	);
	if (!GOOGLE_FORMAT_RE.test(content)) return null;
	return AOSP_RE.test(content) ? "aosp" : "google";
};
