import { t as getErrorMessage$1 } from "./utils.js";
import { extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
//#region ../shared/src-js/utils.ts
const ArrayIsArray$1 = Array.isArray, isObject$1 = (v) => typeof v == "object" && !!v && !ArrayIsArray$1(v), TS_MODULE_EXTENSIONS = /* @__PURE__ */ new Set([
	".ts",
	".mts",
	".cts"
]);
function normalizeModuleSpecifierPath(specifier) {
	if (!specifier.startsWith("file:")) return specifier;
	try {
		return fileURLToPath(specifier);
	} catch {
		return specifier;
	}
}
function isTypeScriptModuleSpecifier(specifier) {
	let ext = extname(normalizeModuleSpecifierPath(specifier)).toLowerCase();
	return TS_MODULE_EXTENSIONS.has(ext);
}
function isUnknownFileExtensionError(err) {
	if (err?.code === "ERR_UNKNOWN_FILE_EXTENSION") return !0;
	let message = err?.message;
	return typeof message == "string" && /unknown(?: or unsupported)? file extension/i.test(message);
}
function getErrorMessage(err) {
	return err instanceof Error ? err.message : String(err);
}
/**
* Returns a complete replacement string suitable for `Error.message` assignment
* (includes the original error message + appended hint), or `null` when the
* error is unrelated to TS module loading. Callers should overwrite, not append.
*/
function getUnsupportedTypeScriptModuleLoadHintForError(err, specifier, nodeVersion = process.version) {
	return !isTypeScriptModuleSpecifier(specifier) || !isUnknownFileExtensionError(err) ? null : `${getErrorMessage(err)}\n\nTypeScript config files require Node.js ^20.19.0 || >=22.18.0.\nDetected Node.js ${nodeVersion}.\nPlease upgrade Node.js or use a JSON config file instead.`;
}
//#endregion
//#region ../shared/src-js/js_config/index.ts
/**
* Import a JS/TS config file and return its `default` export as a plain object.
*
* - Bypasses Node.js module cache (uses `?cache=<key>`) so changed files reload (used for LSP).
* - On `ERR_UNKNOWN_FILE_EXTENSION` for TS specifiers, wraps the error with a Node.js upgrade hint message;
*   The original error is preserved via `Error.cause`.
*
* @param path - Absolute path to the JS/TS config file
* @param cacheKey - Cache-busting key.
*   Callers decide whether to use a fresh value per call or share one across a batch.
* @throws When the file has no `default` export, the export is not a plain object,
*   or import fails (wrapped with hint message for unsupported TS module load).
*/
async function importJsConfig(path, cacheKey) {
	let fileUrl = pathToFileURL(path);
	fileUrl.searchParams.set("cache", cacheKey.toString());
	let module;
	try {
		module = await import(fileUrl.href);
	} catch (err) {
		let hint = getUnsupportedTypeScriptModuleLoadHintForError(err, path);
		throw hint ? Error(hint, { cause: err }) : err;
	}
	if (module.default === void 0) throw Error("Configuration file has no default export.");
	if (!isObject$1(module.default)) throw Error("Configuration file must have a default export that is an object.");
	return module.default;
}
//#endregion
//#region ../shared/src-js/vite_plus_config.ts
let vitePlusCache = null;
/**
* Resolve a Vite+ config via `vite-plus`'s `resolveConfig` and extract the given field.
*
* `vite-plus` is loaded lazily and memoized for the process.
* Consumers declare it as an optional peer dependency; tsdown leaves the specifier external
* so the user-installed copy is used at runtime.
*
* @param path - Absolute path to the Vite config file
* @param fieldName - Field name to extract from the resolved config (e.g. `"fmt"`, `"lint"`)
* @returns The field as an object, or `null` when the field is missing (signals "skip")
* @throws When the field exists but is not a plain object
*/
async function loadViteConfigField(path, fieldName) {
	vitePlusCache ??= import("vite-plus");
	let { resolveConfig } = await vitePlusCache, config = await resolveConfig({ configFile: path }, "build");
	if (!(fieldName in config)) return null;
	let fieldValue = config[fieldName];
	if (!isObject$1(fieldValue)) throw Error(`The \`${fieldName}\` field in the default export must be an object.`);
	return fieldValue;
}
//#endregion
//#region src-js/js_config.ts
const ArrayIsArray = Array.isArray, JSONStringify = JSON.stringify, DateNow = Date.now, isObject = (v) => typeof v == "object" && !!v && !ArrayIsArray(v);
function validateConfigExtends(root) {
	let visited = /* @__PURE__ */ new WeakSet(), inStack = /* @__PURE__ */ new WeakSet(), stackObjects = [], stackPaths = [], formatCycleError = (refPath, cycleStart, idx) => `\`extends\` contains a circular reference.

${refPath} points back to ${cycleStart}\nCycle: ${idx === -1 ? `${cycleStart} -> ${cycleStart}` : [...stackPaths.slice(idx), cycleStart].join(" -> ")}`, visit = (config, path) => {
		if (visited.has(config)) return;
		if (inStack.has(config)) {
			let idx = stackObjects.indexOf(config), cycleStart = idx === -1 ? "<unknown>" : stackPaths[idx];
			throw Error(formatCycleError(path, cycleStart, idx));
		}
		inStack.add(config), stackObjects.push(config), stackPaths.push(path);
		let maybeExtends = config.extends;
		if (maybeExtends !== void 0) {
			if (!ArrayIsArray(maybeExtends)) throw Error("`extends` must be an array of config objects (strings/paths are not supported).");
			for (let i = 0; i < maybeExtends.length; i++) {
				let item = maybeExtends[i];
				if (!isObject(item)) throw Error(`\`extends[${i}]\` must be a config object (strings/paths are not supported).`);
				let itemPath = `${path}.extends[${i}]`;
				if (inStack.has(item)) {
					let idx = stackObjects.indexOf(item), cycleStart = idx === -1 ? "<unknown>" : stackPaths[idx];
					throw Error(formatCycleError(itemPath, cycleStart, idx));
				}
				visit(item, itemPath);
			}
		}
		inStack.delete(config), stackObjects.pop(), stackPaths.pop(), visited.add(config);
	};
	visit(root, "<root>");
}
/**
* Resolve a single config path to a `JsConfigResult`.
* Standard mode: default export must be a plain object.
*/
async function resolveJsConfig(path, cacheKey) {
	let config = await importJsConfig(path, cacheKey);
	return validateConfigExtends(config), {
		path,
		config
	};
}
/**
* Resolve a single Vite+ config path to a `JsConfigResult`.
* Extracts the `.lint` field via `vite-plus`. Returns `null` config when missing (signals "skip").
*/
async function resolveVitePlusConfig(path) {
	let lintConfig = await loadViteConfigField(path, "lint");
	return lintConfig === null ? {
		path,
		config: null
	} : (validateConfigExtends(lintConfig), {
		path,
		config: lintConfig
	});
}
/**
* Load config files in parallel using the given resolver, and return JSON-stringified result.
*/
async function loadConfigs(paths, resolver) {
	try {
		let results = await Promise.allSettled(paths.map(resolver)), successes = [], errors = [];
		for (let i = 0; i < results.length; i++) {
			let result = results[i];
			result.status === "fulfilled" ? successes.push(result.value) : errors.push({
				path: paths[i],
				error: getErrorMessage$1(result.reason)
			});
		}
		return errors.length > 0 ? JSONStringify({ Failures: errors }) : JSONStringify({ Success: successes });
	} catch (err) {
		return JSONStringify({ Error: getErrorMessage$1(err) });
	}
}
/**
* Load standard oxlint JS/TS config files in parallel.
*/
const loadJsConfigs = (paths) => {
	let cacheKey = DateNow();
	return loadConfigs(paths, (path) => resolveJsConfig(path, cacheKey));
}, loadVitePlusConfigs = (paths) => loadConfigs(paths, resolveVitePlusConfig);
//#endregion
export { loadJsConfigs, loadVitePlusConfigs };
