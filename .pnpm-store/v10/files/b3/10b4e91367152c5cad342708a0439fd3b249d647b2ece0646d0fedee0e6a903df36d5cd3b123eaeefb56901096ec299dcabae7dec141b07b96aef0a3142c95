import { createRequire as __cjs_createRequire } from "node:module";
const __cjs_require = __cjs_createRequire(import.meta.url);
import { a as fsStat, i as fsRemove, o as lowestCommonAncestor, r as fsExists, s as stripExtname } from "./format-DLxyxnif.mjs";
import { c as resolveRegex, i as matchPattern, l as slash, o as pkgExists, r as importWithError, s as resolveComma, t as createConcurrencyExecutor, u as toArray } from "./general-BbZk8B18.mjs";
import { a as getNameLabel, i as generateColor, n as createLogger, o as globalLogger } from "./logger-Das7E2bJ.mjs";
import { n as resolveDepsConfig } from "./deps-B_uZzM4C.mjs";
import { n as resolveTarget, o as validateSea } from "./target-Bab3CUeB.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { isDeepStrictEqual, parseEnv } from "node:util";
import { blue, underline } from "ansis";
import { createDefu } from "defu";
import { createDebug } from "obug";
import { RE_CSS, RE_DTS, RE_NODE_MODULES, readTsconfig } from "rolldown-plugin-dts/internal";
import { glob, isDynamicPattern } from "tinyglobby";
const picomatch = __cjs_require("picomatch");
import { readFileSync, writeFileSync } from "node:fs";
import { up } from "empathic/find";
import { up as up$1 } from "empathic/package";
import { pathToFileURL } from "node:url";
import { depsStore, init, isSupported } from "import-without-cache";
import { createConfigCoreLoader } from "unconfig-core";
//#region src/features/clean.ts
const debug$3 = createDebug("tsdown:clean");
const RE_LAST_SLASH = /[/\\]$/;
async function cleanOutDir(configs) {
	const removes = /* @__PURE__ */ new Set();
	for (const config of configs) {
		if (config.devtools && (config.devtools.clean ?? true)) config.clean.push("node_modules/.rolldown");
		if (config.exe) {
			const exeOutDir = path.resolve(config.cwd, config.exe.outDir || "build");
			config.clean.push(exeOutDir);
		}
		if (!config.clean.length) continue;
		const files = await glob(config.clean, {
			cwd: config.cwd,
			absolute: true,
			onlyFiles: false,
			dot: true
		});
		const normalizedOutDir = config.outDir.replace(RE_LAST_SLASH, "");
		for (const file of files) if (file.replace(RE_LAST_SLASH, "") !== normalizedOutDir) removes.add(file);
	}
	if (!removes.size) return;
	globalLogger.info(`Cleaning ${removes.size} files`);
	await Promise.all([...removes].map(async (file) => {
		debug$3("Removing", file);
		await fsRemove(file);
	}));
	debug$3("Removed %d files", removes.size);
}
function resolveClean(clean, outDir, cwd) {
	if (clean === true) clean = [slash(outDir)];
	else if (!clean) clean = [];
	if (clean.some((item) => path.resolve(item) === cwd)) throw new Error("Cannot clean the current working directory. Please specify a different path to clean option.");
	return clean;
}
async function cleanChunks(outDir, chunks) {
	await Promise.all(chunks.map(async (chunk) => {
		const filePath = path.resolve(outDir, chunk.fileName);
		debug$3("Removing chunk file", filePath);
		await fsRemove(filePath);
	}));
}
//#endregion
//#region src/features/entry.ts
async function resolveEntry(logger, entry, cwd, color, nameLabel, root) {
	if (!entry || Object.keys(entry).length === 0) {
		const defaultEntry = path.resolve(cwd, "src/index.ts");
		if (await fsExists(defaultEntry)) entry = { index: defaultEntry };
		else throw new Error(`${nameLabel} No input files, try "tsdown <your-file>" or create src/index.ts`);
	}
	const [entryMap, computedRoot] = await toObjectEntry(entry, cwd, root);
	const entries = Object.values(entryMap);
	if (entries.length === 0) throw new Error(`${nameLabel} Cannot find entry: ${JSON.stringify(entry)}`);
	logger.info(nameLabel, `entry: ${color(entries.map((entry) => path.isAbsolute(entry) ? path.relative(cwd, entry) : entry).join(", "))}`);
	return [entryMap, computedRoot];
}
function toObjectEntry(entry, cwd, root) {
	if (typeof entry === "string") entry = [entry];
	if (!Array.isArray(entry)) return resolveObjectEntry(entry, cwd);
	return resolveArrayEntry(entry, cwd, root);
}
function isGlobEntry(entry) {
	if (!entry) return false;
	if (typeof entry === "string") return isDynamicPattern(entry);
	if (Array.isArray(entry)) return entry.some((e) => typeof e === "string" ? isDynamicPattern(e) : isGlobEntry(e));
	return Object.keys(entry).some((key) => key.includes("*"));
}
async function resolveObjectEntry(entries, cwd) {
	const entry = Object.fromEntries((await Promise.all(Object.entries(entries).map(async ([key, value]) => {
		if (!key.includes("*")) {
			if (Array.isArray(value)) throw new TypeError(`Object entry "${key}" cannot have an array value when the key is not a glob pattern.`);
			return [[key, value]];
		}
		const patterns = toArray(value);
		const files = await glob(patterns, {
			cwd,
			expandDirectories: false
		});
		if (!files.length) throw new Error(`Cannot find files for entry key "${key}" with patterns: ${JSON.stringify(patterns)}`);
		let valueGlobBase;
		for (const pattern of patterns) {
			if (pattern.startsWith("!")) continue;
			const base = picomatch.scan(pattern).base;
			if (valueGlobBase === void 0) valueGlobBase = base;
			else if (valueGlobBase !== base) throw new Error(`When using object entry with glob pattern key "${key}", all value glob patterns must have the same base directory.`);
		}
		if (valueGlobBase === void 0) throw new Error(`Cannot determine base directory for value glob patterns of key "${key}".`);
		return files.map((file) => [slash(key.replaceAll("*", stripExtname(path.relative(valueGlobBase, file)))), path.resolve(cwd, file)]);
	}))).flat());
	return [entry, lowestCommonAncestor(...Object.values(entry))];
}
async function resolveArrayEntry(entries, cwd, root) {
	const stringEntries = [];
	const objectEntries = [];
	for (const e of entries) if (typeof e === "string") stringEntries.push(e);
	else objectEntries.push(e);
	const isGlob = stringEntries.some((e) => isDynamicPattern(e));
	let resolvedEntries;
	if (isGlob) resolvedEntries = (await glob(stringEntries, {
		cwd,
		expandDirectories: false,
		absolute: true
	})).map((file) => path.resolve(file));
	else resolvedEntries = stringEntries;
	const computedRoot = root || lowestCommonAncestor(...resolvedEntries);
	const base = root && !isGlob ? path.relative(cwd, root) || "." : computedRoot;
	const arrayEntryMap = Object.fromEntries(resolvedEntries.map((file) => {
		return [slash(stripExtname(path.relative(base, file))), file];
	}));
	const resolvedObjectEntries = await Promise.all(objectEntries.map(async (entry) => {
		const [entryMap] = await resolveObjectEntry(entry, cwd);
		return entryMap;
	}));
	return [Object.assign({}, arrayEntryMap, ...resolvedObjectEntries), computedRoot];
}
//#endregion
//#region src/utils/json.ts
function writeJsonFile(filePath, content) {
	let originalText;
	let originalJson;
	let originalIndent = 2;
	let originalEOL = "\n";
	let originalHasTrailingNewline = false;
	try {
		originalText = readFileSync(filePath, "utf8");
		originalJson = JSON.parse(originalText);
		originalIndent = detectIndentation(originalText);
		if (originalText.includes("\r\n")) originalEOL = "\r\n";
		if (originalText.endsWith("\n")) originalHasTrailingNewline = true;
	} catch {}
	if (originalJson && (isDeepStrictEqual(originalJson, content) || JSON.stringify(originalJson) === JSON.stringify(content))) return;
	let jsonString = JSON.stringify(content, null, originalIndent);
	if (originalEOL !== "\n") jsonString = jsonString.replaceAll("\n", originalEOL);
	if (originalHasTrailingNewline) jsonString += originalEOL;
	if (originalText === jsonString) return;
	writeFileSync(filePath, jsonString, "utf8");
}
function detectIndentation(jsonText) {
	const lines = jsonText.split(/\r?\n/);
	for (const line of lines) {
		const match = line.match(/^(\s+)\S/);
		if (!match) continue;
		if (match[1].includes("	")) return "	";
		return match[1].length;
	}
	return 2;
}
//#endregion
//#region src/features/pkg/exports.ts
async function writeExports(options, chunks, inlinedDeps) {
	const { pkg } = options;
	const { publishExports, publishBin, bin, ...generated } = await generateExports(pkg, chunks, options, inlinedDeps);
	const updatedPkg = {
		...pkg,
		...generated,
		...bin === void 0 ? {} : { bin },
		packageJsonPath: void 0
	};
	if (publishExports || publishBin) {
		updatedPkg.publishConfig ||= {};
		if (publishExports) updatedPkg.publishConfig.exports = publishExports;
		if (publishBin) updatedPkg.publishConfig.bin = publishBin;
	}
	writeJsonFile(pkg.packageJsonPath, updatedPkg);
}
function shouldExclude(fileName, exclude) {
	if (!exclude?.length) return false;
	return matchPattern(fileName, exclude);
}
async function generateExports(pkg, chunks, options, inlinedDeps) {
	let { exports: { devExports, all, packageJson = true, exclude, customExports, legacy, extensions, inlinedDependencies: emitInlinedDeps = true, bin }, css, logger, cwd } = options;
	const pkgRoot = path.dirname(pkg.packageJsonPath);
	let main, module, cjsTypes, esmTypes;
	const exportsMap = /* @__PURE__ */ new Map();
	const formats = Object.keys(chunks);
	if (!formats.includes("cjs") && !formats.includes("es")) logger.warn(`No CJS or ESM formats found in chunks for package ${pkg.name}`);
	const isPureESM = formats.length === 1 && formats[0] === "es";
	legacy ??= !isPureESM;
	for (const [format, chunksByFormat] of Object.entries(chunks)) {
		if (format !== "es" && format !== "cjs") continue;
		const filteredChunks = chunksByFormat.filter((chunk) => {
			if (chunk.type !== "chunk") return false;
			if (!chunk.isEntry) {
				if (!all) return false;
				if (chunk.facadeModuleId?.[0] === "\0" || chunk.facadeModuleId && RE_NODE_MODULES.test(chunk.facadeModuleId)) return false;
			}
			const [name] = getExportName(chunk);
			return !shouldExclude(name, exclude);
		});
		const onlyOneEntry = filteredChunks.filter((chunk) => !RE_DTS.test(chunk.fileName)).length === 1;
		for (const chunk of filteredChunks) {
			let [name, normalizedName, isDts] = getExportName(chunk);
			const isIndex = onlyOneEntry || name === "index";
			const distFile = join(pkgRoot, chunk.outDir, normalizedName);
			if (isIndex) {
				name = ".";
				if (format === "cjs") if (isDts) cjsTypes = distFile;
				else main = distFile;
				else if (format === "es") if (isDts) esmTypes = distFile;
				else module = distFile;
			} else if (name.endsWith("/index")) name = `./${name.slice(0, -6)}`;
			else name = `./${name}`;
			if (extensions && name !== ".") name = `${name}.js`;
			let subExport = exportsMap.get(name);
			if (!subExport) {
				subExport = {};
				exportsMap.set(name, subExport);
			}
			if (!isDts) {
				subExport[format] = distFile;
				if (chunk.facadeModuleId && !subExport.src) subExport.src = `./${slash(path.relative(pkgRoot, chunk.facadeModuleId))}`;
			}
		}
	}
	const sortedExportsMap = [...exportsMap].toSorted(([a], [b]) => {
		if (a === "index") return -1;
		return a.localeCompare(b);
	});
	let exports = Object.fromEntries(sortedExportsMap.map(([name, subExport]) => [name, genSubExport(devExports, subExport)]));
	exportMeta(exports, all, packageJson);
	exportCss(exports, chunks, css, pkgRoot);
	if (typeof customExports === "object") exports = {
		...exports,
		...customExports
	};
	else if (typeof customExports === "function") exports = await customExports(exports, {
		pkg,
		chunks,
		isPublish: false
	});
	let publishExports;
	if (devExports) {
		publishExports = Object.fromEntries(sortedExportsMap.map(([name, subExport]) => [name, genSubExport(false, subExport)]));
		exportMeta(publishExports, all, packageJson);
		exportCss(publishExports, chunks, css, pkgRoot);
		if (typeof customExports === "object") publishExports = {
			...publishExports,
			...customExports
		};
		else if (typeof customExports === "function") publishExports = await customExports(publishExports, {
			pkg,
			chunks,
			isPublish: true
		});
	}
	const binResult = generateBin(bin, !!devExports, pkg, chunks, pkgRoot, logger, cwd);
	const publishBin = devExports && binResult ? generateBin(bin, false, pkg, chunks, pkgRoot, logger, cwd) : void 0;
	return {
		main: legacy ? main || module || pkg.main : void 0,
		module: legacy ? module || pkg.module : void 0,
		types: legacy ? cjsTypes || esmTypes || pkg.types : pkg.types,
		exports,
		bin: binResult,
		publishBin,
		inlinedDependencies: emitInlinedDeps ? inlinedDeps : void 0,
		publishExports
	};
}
function genSubExport(devExports, { src, es, cjs }) {
	if (devExports === true) return src;
	let value;
	const dualFormat = es && cjs;
	if (!dualFormat && !devExports) value = cjs || es;
	else {
		value = {};
		if (typeof devExports === "string") value[devExports] = src;
		if (es) value[dualFormat ? "import" : "default"] = es;
		if (cjs) value[dualFormat ? "require" : "default"] = cjs;
	}
	return value;
}
function exportMeta(exports, all, packageJson) {
	if (all) exports["./*"] = "./*";
	else if (packageJson) exports["./package.json"] = "./package.json";
}
function exportCss(exports, chunks, css, pkgRoot) {
	if (css?.splitting) return;
	for (const chunksByFormat of Object.values(chunks)) for (const chunk of chunksByFormat) if (chunk.type === "asset" && RE_CSS.test(chunk.fileName)) {
		const filename = slash(chunk.fileName);
		exports[`./${filename}`] = join(pkgRoot, chunk.outDir, filename);
		return;
	}
}
function hasExportsTypes(value) {
	if (value == null || typeof value !== "object") return false;
	if (Array.isArray(value)) return value.some(hasExportsTypes);
	if ("types" in value) return true;
	return Object.values(value).some(hasExportsTypes);
}
const RE_SHEBANG = /^#!.*/;
function generateBin(bin, devExports, pkg, chunks, pkgRoot, logger, cwd) {
	if (bin === false) return;
	if (bin === true || bin === void 0 || typeof bin === "string") {
		if (!pkg.name) throw new Error("Package name is required when using string form for `bin`");
		const binName = pkg.name[0] === "@" ? pkg.name.split("/", 2)[1] : pkg.name;
		if (bin === true || bin === void 0) {
			let detected;
			const seen = /* @__PURE__ */ new Set();
			for (const format of ["es", "cjs"]) {
				const formatChunks = chunks[format];
				if (!formatChunks) continue;
				for (const chunk of formatChunks) {
					if (chunk.type !== "chunk" || !chunk.isEntry || !chunk.facadeModuleId) continue;
					if (!RE_SHEBANG.test(chunk.code)) continue;
					if (seen.has(chunk.facadeModuleId)) continue;
					seen.add(chunk.facadeModuleId);
					if (detected) {
						if (bin === true) throw new Error("Multiple entry chunks with shebangs found. Use `exports.bin: { command: \"./src/file.ts\" }` to specify which one to use.");
						logger.warn("Multiple entry chunks with shebangs found. Use `exports.bin: true` or `exports.bin: { command: \"./src/file.ts\" }` to configure explicitly.");
						return;
					}
					detected = devExports ? `./${slash(path.relative(pkgRoot, chunk.facadeModuleId))}` : join(pkgRoot, chunk.outDir, slash(chunk.fileName));
				}
			}
			if (detected == null) {
				if (bin === true) logger.warn("`exports.bin` is true but no entry chunks with shebangs were found");
				return;
			}
			return { [binName]: detected };
		}
		if (typeof bin === "string") {
			const match = findChunkBySource(bin);
			if (!match) throw new Error(`Could not find output chunk for bin entry "${bin}"`);
			return { [binName]: devExports ? normalizeSource(bin) : match };
		}
	}
	const result = {};
	for (const [cmdName, sourcePath] of Object.entries(bin)) {
		const match = findChunkBySource(sourcePath);
		if (!match) throw new Error(`Could not find output chunk for bin entry "${cmdName}": "${sourcePath}"`);
		result[cmdName] = devExports ? normalizeSource(sourcePath) : match;
	}
	return result;
	function normalizeSource(sourcePath) {
		const resolved = path.resolve(cwd, sourcePath);
		return `./${slash(path.relative(pkgRoot, resolved))}`;
	}
	function findChunkBySource(sourcePath) {
		const resolved = path.resolve(cwd, sourcePath);
		for (const format of ["es", "cjs"]) {
			const formatChunks = chunks[format];
			if (!formatChunks) continue;
			for (const chunk of formatChunks) {
				if (chunk.type !== "chunk" || !chunk.isEntry) continue;
				if (chunk.facadeModuleId !== resolved) continue;
				if (!RE_SHEBANG.test(chunk.code)) logger.warn(`Bin entry "${sourcePath}" does not contain a shebang line`);
				return join(pkgRoot, chunk.outDir, slash(chunk.fileName));
			}
		}
	}
}
function getExportName(chunk) {
	const normalizedName = slash(chunk.fileName);
	let name = stripExtname(normalizedName);
	const isDts = name.endsWith(".d");
	if (isDts) name = name.slice(0, -2);
	return [
		name,
		normalizedName,
		isDts
	];
}
function join(pkgRoot, outDir, fileName) {
	const outDirRelative = slash(path.relative(pkgRoot, outDir));
	return `${outDirRelative ? `./${outDirRelative}` : "."}/${fileName}`;
}
//#endregion
//#region src/features/plugin.ts
async function flattenPlugins(plugins) {
	const awaited = await plugins;
	if (!awaited) return [];
	if (Array.isArray(awaited)) return (await Promise.all(awaited.map(flattenPlugins))).flat();
	return [awaited];
}
//#endregion
//#region src/features/tsconfig.ts
function findTsconfig(cwd, name = "tsconfig.json") {
	return up(name, { cwd }) || false;
}
async function resolveTsconfig(logger, tsconfig, cwd, color, nameLabel) {
	const original = tsconfig;
	if (tsconfig !== false) {
		if (tsconfig === true || tsconfig == null) {
			tsconfig = findTsconfig(cwd);
			if (original && !tsconfig) logger.warn(`No tsconfig found in ${blue(cwd)}`);
		} else {
			const tsconfigPath = path.resolve(cwd, tsconfig);
			const stat = await fsStat(tsconfigPath);
			if (stat?.isFile()) tsconfig = tsconfigPath;
			else if (stat?.isDirectory()) {
				tsconfig = findTsconfig(tsconfigPath);
				if (!tsconfig) logger.warn(`No tsconfig found in ${blue(tsconfigPath)}`);
			} else {
				tsconfig = findTsconfig(cwd, tsconfig);
				if (!tsconfig) logger.warn(`tsconfig ${blue(original)} doesn't exist`);
			}
		}
		if (tsconfig) logger.info(nameLabel, `tsconfig: ${color(path.relative(cwd, tsconfig))}`);
	}
	return tsconfig;
}
//#endregion
//#region src/utils/ci.ts
function isInCI() {
	const ci = process.env.CI;
	return ci != null && ci !== "0" && ci.toLowerCase() !== "false";
}
//#endregion
//#region src/utils/package.ts
const debug$2 = createDebug("tsdown:package");
async function readPackageJson(dir) {
	const packageJsonPath = up$1({ cwd: dir });
	if (!packageJsonPath) return;
	debug$2("Reading package.json:", packageJsonPath);
	const contents = await readFile(packageJsonPath, "utf8");
	return {
		...JSON.parse(contents),
		packageJsonPath
	};
}
function getPackageType(pkg) {
	if (!pkg?.type) return;
	if (!["module", "commonjs"].includes(pkg.type)) throw new Error(`Invalid package.json type: ${pkg.type}`);
	return pkg.type;
}
function normalizeFormat(format) {
	switch (format) {
		case "es":
		case "esm":
		case "module": return "es";
		case "cjs":
		case "commonjs": return "cjs";
		default: return format;
	}
}
//#endregion
//#region src/config/file.ts
const debug$1 = createDebug("tsdown:config:file");
async function loadViteConfig(prefix, cwd, configLoader) {
	const loader = resolveConfigLoader(configLoader);
	debug$1("Loading Vite config via loader: ", loader);
	const parser = createParser(loader);
	const [result] = await createConfigCoreLoader({
		sources: [{
			files: [`${prefix}.config`],
			extensions: [
				"js",
				"mjs",
				"ts",
				"cjs",
				"mts",
				"cts"
			],
			parser
		}],
		cwd
	}).load(true);
	if (!result) return;
	let { config: [exported, deps], source } = result;
	globalLogger.info(`Using Vite config: ${underline(source)}`);
	exported = await exported;
	if (typeof exported === "function") exported = await exported({
		command: "build",
		mode: "production"
	});
	return {
		config: exported,
		deps
	};
}
const configPrefix = "tsdown.config";
async function loadConfigFile(inlineConfig, workspace, rootConfig) {
	let cwd = inlineConfig.cwd || process.cwd();
	let { config: filePath } = inlineConfig;
	if (filePath === false) return { configs: [{}] };
	let overrideConfig = false;
	if (typeof filePath === "string") {
		const stats = await fsStat(filePath);
		if (stats) {
			const resolved = path.resolve(filePath);
			if (stats.isFile()) {
				overrideConfig = true;
				filePath = resolved;
				cwd = path.dirname(filePath);
			} else if (stats.isDirectory()) cwd = resolved;
		}
	}
	const loader = resolveConfigLoader(inlineConfig.configLoader);
	debug$1("Using config loader:", loader);
	const parser = createParser(loader);
	const [result] = await createConfigCoreLoader({
		sources: overrideConfig ? [{
			files: [filePath],
			extensions: [],
			parser
		}] : [{
			files: [configPrefix],
			extensions: [
				"ts",
				"mts",
				"cts",
				"js",
				"mjs",
				"cjs",
				"json"
			],
			parser
		}, {
			files: ["package.json"],
			parser
		}],
		cwd,
		stopAt: workspace && path.dirname(workspace)
	}).load(true);
	let exported = [];
	let file;
	let deps;
	if (result) {
		({config: [exported, deps], source: file} = result);
		globalLogger.info(`config file: ${underline(file)}`, loader === "native" ? "" : `(${loader})`);
		exported = await exported;
		if (typeof exported === "function") exported = await exported(inlineConfig, {
			ci: isInCI(),
			rootConfig
		});
	}
	exported = toArray(exported);
	if (exported.length === 0) exported.push({});
	if (exported.some((config) => typeof config === "function")) throw new Error("Function should not be nested within multiple tsdown configurations. It must be at the top level.\nExample: export default defineConfig(() => [...])");
	return {
		configs: exported.map((config) => ({
			...config,
			cwd: config.cwd ? path.resolve(cwd, config.cwd) : cwd
		})),
		deps
	};
}
const isBun = !!process.versions.bun;
const nativeTS = process.features.typescript || process.versions.deno;
const autoLoader = isBun || nativeTS && isSupported ? "native" : "unrun";
function resolveConfigLoader(configLoader = "auto") {
	return configLoader === "auto" ? autoLoader : configLoader;
}
function createParser(loader) {
	return async (filepath) => {
		const basename = path.basename(filepath);
		const isPkgJson = basename === "package.json";
		if (basename === configPrefix || isPkgJson || basename.endsWith(".json")) {
			const contents = await readFile(filepath, "utf8");
			const parsed = JSON.parse(contents);
			return [isPkgJson ? parsed?.tsdown : parsed, /* @__PURE__ */ new Set([filepath])];
		}
		switch (loader) {
			case "native": return nativeImport(filepath);
			case "tsx": return tsxImport(filepath);
			case "unrun": return unrunImport(filepath);
			default: throw new Error(`Unknown config loader: ${loader}`);
		}
	};
}
async function nativeImport(id) {
	const deps = /* @__PURE__ */ new Set([id]);
	const url = pathToFileURL(id);
	const importAttributes = Object.create(null);
	if (isSupported) {
		importAttributes.cache = "no";
		init({ skipNodeModules: true });
	} else if (!isBun) url.searchParams.set("no-cache", crypto.randomUUID());
	const mod = await depsStore.run(deps, () => import(url.href, { with: importAttributes }).catch((error) => {
		if (error?.message?.includes?.("Cannot find module")) throw new Error(`Failed to load the config file. Try setting the --config-loader CLI flag to \`tsx\` or \`unrun\`.\n\n${error.message}`, { cause: error });
		if (String(error).includes("not supported in strip-only mode")) throw new Error(`Failed to load the config file because it contains TypeScript-specific syntax that Node.js cannot execute directly. Please set the --config-loader CLI flag to \`tsx\` or \`unrun\`.\n\n${error.message}`, { cause: error });
		if (typeof error?.stack === "string" && error.stack.includes("node:internal/modules/esm/translators")) throw new Error(`Failed to load the config file due to a known Node.js bug. Try setting the --config-loader CLI flag to \`tsx\` or \`unrun\`, or upgrading Node.js to v24.11.1 or later.\n\n${error.message}`, { cause: error });
		throw error;
	}));
	return [mod?.default || mod, deps];
}
async function tsxImport(id) {
	const { tsImport } = await importWithError("tsx/esm/api");
	const module = await tsImport(pathToFileURL(id).href, import.meta.url);
	return [module?.default || module, /* @__PURE__ */ new Set([id])];
}
async function unrunImport(id) {
	const { unrun } = await importWithError("unrun");
	const { module, dependencies } = await unrun({ path: pathToFileURL(id).href });
	return [module, new Set(dependencies)];
}
//#endregion
//#region src/config/options.ts
const debug = createDebug("tsdown:config:options");
/**
* Resolve user config into resolved configs
*
* **Internal API, not for public use**
* @private
*/
async function resolveUserConfig(userConfig, inlineConfig, configDeps, runBuild = createConcurrencyExecutor()) {
	{
		const flat = await flattenPlugins(userConfig.plugins);
		for (const plugin of flat) {
			const result = await plugin.tsdownConfig?.(userConfig, inlineConfig);
			if (result) userConfig = mergeConfig(userConfig, result);
		}
	}
	let { entry, format, plugins = [], clean = true, logLevel = "info", failOnWarn = false, suppressWarnings, customLogger, treeshake = true, platform = "node", outDir = "dist", sourcemap = false, dts, unused = false, watch = false, ignoreWatch, shims = false, publint = false, attw = false, fromVite, alias, tsconfig, report = true, target, env = {}, envFile, envPrefix = "TSDOWN_", copy, publicDir, hash = true, cwd = process.cwd(), name, workspace, exports = false, bundle, unbundle = typeof bundle === "boolean" ? !bundle : false, root, removeNodeProtocol, nodeProtocol, cjsDefault = true, globImport = true, css, injectStyle, outExtension, outExtensions, fixedExtension = platform === "node", devtools = false, write = true, exe = false } = userConfig;
	const pkg = await readPackageJson(cwd);
	if (workspace) name ||= pkg?.name;
	const color = generateColor(name);
	const nameLabel = getNameLabel(color, name);
	if (!filterConfig(inlineConfig.filter, cwd, name)) {
		debug("[filter] skipping config %s", cwd);
		return [];
	}
	const logger = createLogger(logLevel, {
		customLogger,
		failOnWarn: resolveFeatureOption(failOnWarn, true),
		suppressWarnings
	});
	if (typeof bundle === "boolean") logger.warn("`bundle` option is deprecated. Use `unbundle` instead.");
	if (removeNodeProtocol) {
		if (nodeProtocol) throw new TypeError("`removeNodeProtocol` is deprecated. Please only use `nodeProtocol` instead.");
		logger.warn("`removeNodeProtocol` is deprecated. Use `nodeProtocol: \"strip\"` instead.");
	}
	nodeProtocol = nodeProtocol ?? (removeNodeProtocol ? "strip" : false);
	outDir = path.resolve(cwd, outDir);
	clean = resolveClean(clean, outDir, cwd);
	const rawEntry = entry;
	const [resolvedEntry, resolvedRoot] = await resolveEntry(logger, entry, cwd, color, nameLabel, root ? path.resolve(cwd, root) : void 0);
	target = resolveTarget(logger, target, color, pkg, nameLabel);
	tsconfig = await resolveTsconfig(logger, tsconfig, cwd, color, nameLabel);
	publint = resolveFeatureOption(publint, {});
	attw = resolveFeatureOption(attw, {});
	exports = resolveFeatureOption(exports, {});
	unused = resolveFeatureOption(unused, {});
	report = resolveFeatureOption(report, {});
	exe = resolveFeatureOption(exe, {});
	if (dts == null) if (exe) dts = false;
	else if (pkg?.types || pkg?.typings || hasExportsTypes(pkg?.exports)) dts = true;
	else if (tsconfig) {
		const { config } = readTsconfig(tsconfig);
		dts = !!config.compilerOptions?.declaration;
	} else dts = false;
	dts = resolveFeatureOption(dts, {});
	if (!pkg) {
		if (exports) throw new Error("`package.json` not found, cannot write exports");
		if (publint) logger.warn(nameLabel, "publint is enabled but package.json is not found");
		if (attw) logger.warn(nameLabel, "attw is enabled but package.json is not found");
	}
	if (injectStyle != null) if (css?.inject == null) {
		logger.warn(`${blue`injectStyle`} is deprecated. Use ${blue`css.inject`} instead.`);
		css = {
			...css,
			inject: injectStyle
		};
	} else throw new TypeError("`injectStyle` is deprecated. Cannot be used with `css.inject`");
	if (publicDir) if (copy) throw new TypeError("`publicDir` is deprecated. Cannot be used with `copy`");
	else logger.warn(`${blue`publicDir`} is deprecated. Use ${blue`copy`} instead.`);
	if (outExtension) {
		if (outExtensions) throw new TypeError("`outExtension` is deprecated. Cannot be used with `outExtensions`");
		logger.warn(`${blue`outExtension`} is deprecated. Use ${blue`outExtensions`} instead.`);
		outExtensions = outExtension;
	}
	envPrefix = toArray(envPrefix);
	if (envPrefix.includes("")) logger.warn("`envPrefix` includes an empty string; filtering is disabled. All environment variables from the env file and process.env will be injected into the build. Ensure this is intended to avoid accidental leakage of sensitive information.");
	const envFromProcess = filterEnv(process.env, envPrefix);
	if (envFile) {
		const resolvedPath = path.resolve(cwd, envFile);
		logger.info(nameLabel, `env file: ${color(resolvedPath)}`);
		env = {
			...filterEnv(parseEnv(await readFile(resolvedPath, "utf8")), envPrefix),
			...envFromProcess,
			...env
		};
	} else env = {
		...envFromProcess,
		...env
	};
	debug(`Environment variables: %O`, env);
	configDeps = new Set(configDeps);
	if (fromVite) {
		const viteUserConfig = await loadViteConfig(fromVite === true ? "vite" : fromVite, cwd, inlineConfig.configLoader);
		if (viteUserConfig) {
			const { config, deps } = viteUserConfig;
			deps?.forEach((dep) => configDeps.add(dep));
			const viteAlias = config.resolve?.alias;
			if (Array.isArray(viteAlias)) throw new TypeError("Unsupported resolve.alias in Vite config. Use object instead of array");
			if (viteAlias) alias = {
				...alias,
				...viteAlias
			};
			if (config.plugins) plugins = [config.plugins, plugins];
		}
	}
	ignoreWatch = toArray(ignoreWatch).map((ignore) => {
		ignore = resolveRegex(ignore);
		if (typeof ignore === "string") return path.resolve(cwd, ignore);
		return ignore;
	});
	const depsConfig = resolveDepsConfig(userConfig, logger);
	devtools = resolveFeatureOption(devtools, {});
	if (devtools) if (watch) {
		if (devtools.ui) logger.warn("Devtools UI is not supported in watch mode, disabling it.");
		devtools.ui = false;
	} else devtools.ui ??= !!pkgExists("@vitejs/devtools/cli");
	const config = {
		...userConfig,
		alias,
		attw,
		cjsDefault,
		clean,
		configDeps,
		copy: publicDir || copy,
		css,
		cwd,
		deps: depsConfig,
		devtools,
		dts,
		entry: resolvedEntry,
		env,
		exe,
		exports,
		fixedExtension,
		globImport,
		hash,
		ignoreWatch,
		logger,
		name,
		nameLabel,
		nodeProtocol,
		outDir,
		outExtensions,
		pkg,
		platform,
		plugins,
		publint,
		rawEntry,
		report,
		root: resolvedRoot,
		runBuild,
		shims,
		sourcemap,
		target,
		treeshake,
		tsconfig,
		unbundle,
		unused,
		watch,
		write
	};
	if (exe) validateSea(config);
	const objectFormat = typeof format === "object" && !Array.isArray(format);
	const resolvedConfigs = (objectFormat ? Object.keys(format) : resolveComma(toArray(format, "esm"))).map((fmt, idx) => {
		const once = idx === 0;
		const overrides = objectFormat ? format[fmt] : void 0;
		return {
			...config,
			copy: once ? config.copy : void 0,
			onSuccess: once ? config.onSuccess : void 0,
			format: normalizeFormat(fmt),
			...overrides,
			runBuild
		};
	});
	for (const resolved of resolvedConfigs) {
		const finalPlugins = await flattenPlugins(resolved.plugins);
		for (const plugin of finalPlugins) await plugin.tsdownConfigResolved?.(resolved);
	}
	return resolvedConfigs;
}
/** filter env variables by prefixes */
function filterEnv(envDict, envPrefixes) {
	const env = {};
	for (const [key, value] of Object.entries(envDict)) if (value != null && envPrefixes.some((prefix) => key.startsWith(prefix))) env[key] = value;
	return env;
}
const defu = createDefu((obj, key, value, namespace) => {
	if (key === "plugins" && (namespace === "" || namespace === "inputOptions" || namespace === "outputOptions")) {
		obj[key] = [].concat(obj[key], value);
		return true;
	}
	if (Array.isArray(obj[key]) && Array.isArray(value)) {
		obj[key] = value;
		return true;
	}
});
function mergeConfig(defaults, ...overrides) {
	return defu(...overrides.toReversed(), defaults);
}
async function mergeUserOptions(defaults, user, args) {
	if (!user) return defaults;
	if (typeof user === "function") return await user(defaults, ...args) ?? defaults;
	return defu(user, defaults);
}
function resolveFeatureOption(value, defaults) {
	if (typeof value === "object" && value !== null) return resolveCIOption(value.enabled ?? true) ? value : false;
	return resolveCIOption(value) ? defaults : false;
}
function resolveCIOption(value) {
	if (value === "ci-only") return isInCI();
	if (value === "local-only") return !isInCI();
	return value;
}
function filterConfig(filter, configCwd, name) {
	if (!filter) return true;
	let cwd = path.relative(process.cwd(), configCwd);
	if (cwd === "") cwd = ".";
	if (filter instanceof RegExp) return name && filter.test(name) || filter.test(cwd);
	return toArray(filter).some((value) => name && name === value || cwd === value);
}
//#endregion
export { getPackageType as a, toObjectEntry as c, loadConfigFile as i, cleanChunks as l, mergeUserOptions as n, writeExports as o, resolveUserConfig as r, isGlobEntry as s, mergeConfig as t, cleanOutDir as u };
