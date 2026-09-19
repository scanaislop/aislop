import { a as fsStat, i as fsRemove, t as formatBytes } from "./format-DLxyxnif.mjs";
import { r as importWithError, s as resolveComma, u as toArray } from "./general-BbZk8B18.mjs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { bold, dim, red } from "ansis";
import { createDebug } from "obug";
import { RE_DTS } from "rolldown-plugin-dts/internal";
import { tmpdir } from "node:os";
import { x } from "tinyexec";
import { findMinimumForRange, isGreaterOrEqual } from "verkit";
//#region src/features/exe.ts
const NODE_SEA_MIN_VERSION = "25.7.0";
const NODE_SEA_MIN_VERSION_PARSED = {
	major: 25,
	minor: 7,
	patch: 0
};
const debug = createDebug("tsdown:exe");
function validateSea({ dts, entry, logger, nameLabel }) {
	if (process.versions.bun || process.versions.deno) throw new Error("The `exe` option is not supported in Bun and Deno environments.");
	if (!isGreaterOrEqual(process.version, NODE_SEA_MIN_VERSION_PARSED)) throw new Error(`Node.js version ${process.version} does not support \`exe\` option. Please upgrade to Node.js ${NODE_SEA_MIN_VERSION} or later.`);
	if (Object.keys(entry).length > 1) throw new Error(`The \`exe\` feature currently only supports single entry points. Found entries:\n${JSON.stringify(entry, void 0, 2)}`);
	if (dts) logger.warn(nameLabel, `Generating .d.ts files with \`exe\` option is not recommended since they won't be included in the executable. Consider separating your library and executable targets if you need type declarations.`);
	logger.info(nameLabel, "`exe` option is experimental and may change in future releases.");
}
async function buildExe(config, chunks) {
	if (!config.exe) return;
	const filteredChunks = chunks.filter((chunk) => !RE_DTS.test(chunk.fileName));
	if (filteredChunks.length > 1) throw new Error(`The 'exe' feature currently only supports single-chunk outputs. Found ${filteredChunks.length} chunks.\nChunks:\n${filteredChunks.map((c) => `- ${c.fileName}`).join("\n")}`);
	const chunk = filteredChunks[0];
	debug("Building executable with SEA for chunk:", chunk.fileName);
	const bundledFile = path.join(config.outDir, chunk.fileName);
	const { targets } = config.exe;
	if (targets?.length) {
		if (config.exe.seaConfig?.executable) config.logger.warn(config.nameLabel, "`seaConfig.executable` is ignored when `targets` is specified.");
		const { resolveNodeBinary, getTargetSuffix } = await importWithError("@tsdown/exe");
		for (const target of targets) {
			const nodeBinaryPath = await resolveNodeBinary(target, config.exe, config.logger);
			const suffix = getTargetSuffix(target);
			await buildSingleExe(config, bundledFile, resolveOutputFileName(config.exe, chunk, bundledFile, target, suffix), nodeBinaryPath, target);
		}
	} else await buildSingleExe(config, bundledFile, resolveOutputFileName(config.exe, chunk, bundledFile));
}
function resolveOutputFileName(exe, chunk, bundledFile, target, suffix) {
	let baseName;
	if (exe.fileName) baseName = typeof exe.fileName === "function" ? exe.fileName(chunk) : exe.fileName;
	else baseName = path.basename(bundledFile, path.extname(bundledFile));
	if (suffix) baseName += suffix;
	if (target?.platform ? target.platform === "win" : process.platform === "win32") baseName += ".exe";
	return baseName;
}
async function buildSingleExe(config, bundledFile, outputFile, executable, target) {
	const exe = config.exe;
	const exeOutDir = path.resolve(config.cwd, exe.outDir || "build");
	await mkdir(exeOutDir, { recursive: true });
	const outputPath = path.join(exeOutDir, outputFile);
	debug("Building SEA executable: %s -> %s", bundledFile, outputPath);
	const t = performance.now();
	const tempDir = await mkdtemp(path.join(tmpdir(), "tsdown-sea-"));
	try {
		const seaConfig = {
			disableExperimentalSEAWarning: true,
			...exe.seaConfig,
			main: bundledFile,
			output: outputPath,
			mainFormat: config.format === "es" ? "module" : "commonjs"
		};
		if (executable) seaConfig.executable = executable;
		const seaConfigPath = path.join(tempDir, "sea-config.json");
		await writeFile(seaConfigPath, JSON.stringify(seaConfig));
		debug("Wrote sea-config.json: %O -> %s", seaConfig, seaConfigPath);
		debug("Running: %s --build-sea %s", process.execPath, seaConfigPath);
		await x(process.execPath, ["--build-sea", seaConfigPath], {
			nodeOptions: { stdio: [
				"ignore",
				"ignore",
				"inherit"
			] },
			throwOnError: true,
			nodePath: false
		});
	} finally {
		if (debug.enabled) debug("Preserving temp directory for debugging: %s", tempDir);
		else await fsRemove(tempDir);
	}
	if ((target?.platform || process.platform) === "darwin") try {
		await x("codesign", [
			"--sign",
			"-",
			outputPath
		], {
			nodeOptions: { stdio: "inherit" },
			throwOnError: true,
			nodePath: false
		});
	} catch {
		config.logger.warn(config.nameLabel, `Failed to code-sign the executable. ${process.platform === "darwin" ? `You can sign it manually using:\n  codesign --sign - "${outputPath}"` : `Automatic code signing is not supported on ${process.platform}.`}`);
	}
	const stat = await fsStat(outputPath);
	if (stat) {
		const sizeText = formatBytes(stat.size);
		config.logger.info(config.nameLabel, bold(path.relative(config.cwd, outputPath)), ` ${dim(sizeText)}`);
	}
	config.logger.success(config.nameLabel, `Built executable: ${red(path.relative(config.cwd, outputPath))}`, dim`(${Math.round(performance.now() - t)}ms)`);
}
//#endregion
//#region src/features/target.ts
const BASELINE_WIDELY_AVAILABLE_TARGET = [
	"chrome111",
	"edge111",
	"firefox114",
	"safari16.4",
	"ios16.4"
];
function expandBaselineTarget(targets) {
	return targets.flatMap((t) => t === "baseline-widely-available" ? BASELINE_WIDELY_AVAILABLE_TARGET : t);
}
function resolveTarget(logger, target, color, pkg, nameLabel) {
	if (target === false) return;
	if (target == null) {
		const pkgTarget = resolvePackageTarget(pkg);
		if (pkgTarget) target = pkgTarget;
		else return;
	}
	if (typeof target === "number") throw new TypeError(`Invalid target: ${target}`);
	const targets = expandBaselineTarget(resolveComma(toArray(target)));
	if (targets.length) logger.info(nameLabel, `target${targets.length > 1 ? "s" : ""}: ${color(targets.join(", "))}`);
	return targets;
}
function resolvePackageTarget(pkg) {
	const nodeVersion = pkg?.engines?.node;
	if (!nodeVersion) return;
	const nodeMinVersion = findMinimumForRange(nodeVersion);
	if (!nodeMinVersion) return;
	if (nodeMinVersion === "0.0.0") return;
	return `node${nodeMinVersion}`;
}
//#endregion
export { buildExe as a, NODE_SEA_MIN_VERSION_PARSED as i, resolveTarget as n, validateSea as o, NODE_SEA_MIN_VERSION as r, expandBaselineTarget as t };
