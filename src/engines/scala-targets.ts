import fs from "node:fs";
import path from "node:path";
import { getSourceFiles } from "../utils/source-files.js";
import type { EngineContext } from "./types.js";

const SCALA_EXTENSIONS = new Set([".scala", ".sc"]);

export const getScalaTargets = (context: EngineContext): string[] => {
	const files = context.files ?? getSourceFiles(context);
	const targets = files
		.filter((filePath) => SCALA_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
		.map((filePath) => {
			const absolutePath = path.isAbsolute(filePath)
				? filePath
				: path.resolve(context.rootDirectory, filePath);
			return path.relative(context.rootDirectory, absolutePath).split(path.sep).join("/");
		})
		.filter((filePath) => filePath.length > 0 && !filePath.startsWith(".."));
	return [...new Set(targets)];
};

// scalafmt reads its configuration from .scalafmt.conf; without one it
// refuses to run, so the format engine only applies when the project has
// opted in by committing that file (the same gating style as the Java
// build-file style detection).
export const hasScalafmtConfig = (rootDirectory: string): boolean =>
	fs.existsSync(path.join(rootDirectory, ".scalafmt.conf"));
