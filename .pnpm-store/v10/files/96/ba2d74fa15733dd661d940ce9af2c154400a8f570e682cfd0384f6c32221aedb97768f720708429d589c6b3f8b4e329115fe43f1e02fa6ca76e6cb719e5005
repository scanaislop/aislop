import "./shared/binding-Bd04_f8P.mjs";
import { n as onExit, t as watch } from "./shared/watch-29c_freO.mjs";
import "./shared/normalize-string-or-regex-DoNa0azR.mjs";
import { S as version, x as description } from "./shared/bindingify-input-options-F1XJD4OD.mjs";
import { t as arraify } from "./shared/misc-Xty885dB.mjs";
import { a as getInputCliKeys, i as getCliSchemaInfo, l as styleText$1, o as getOutputCliKeys, r as logger, s as validateCliOptions } from "./shared/rolldown-build-BsRSEDqH.mjs";
import "./shared/error-BYPsvVEN.mjs";
import "./shared/parse-DaVGTrLj.mjs";
import { t as rolldown } from "./shared/rolldown-BHeK3xLJ.mjs";
import { t as loadConfig } from "./shared/load-config-BIbmufAp.mjs";
import path from "node:path";
import { parseArgs } from "node:util";
import process$1 from "node:process";
import { performance } from "node:perf_hooks";

//#region src/cli/arguments/alias.ts
const alias = {
	config: {
		abbreviation: "c",
		hint: "filename"
	},
	help: { abbreviation: "h" },
	version: { abbreviation: "v" },
	watch: { abbreviation: "w" },
	dir: {
		abbreviation: "d",
		requireValue: true
	},
	file: {
		abbreviation: "o",
		requireValue: true
	},
	external: { abbreviation: "e" },
	format: { abbreviation: "f" },
	name: { abbreviation: "n" },
	globals: { abbreviation: "g" },
	sourcemap: {
		abbreviation: "s",
		default: true
	},
	minify: { abbreviation: "m" },
	platform: { abbreviation: "p" },
	assetFileNames: { hint: "name" },
	chunkFileNames: { hint: "name" },
	entryFileNames: { hint: "name" },
	externalLiveBindings: {
		default: true,
		reverse: true
	},
	treeshake: {
		default: true,
		reverse: true
	},
	preserveEntrySignatures: {
		default: "strict",
		reverse: true
	},
	moduleTypes: { hint: "types" }
};

//#endregion
//#region src/cli/arguments/utils.ts
function setNestedProperty(obj, path, value) {
	const keys = path.split(".");
	let current = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		if (!current[keys[i]]) current[keys[i]] = {};
		current = current[keys[i]];
	}
	const finalKey = keys[keys.length - 1];
	Object.defineProperty(current, finalKey, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function camelCaseToKebabCase(str) {
	return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
function kebabCaseToCamelCase(str) {
	return str.replace(/-./g, (match) => match[1].toUpperCase());
}

//#endregion
//#region src/cli/arguments/normalize.ts
function normalizeCliOptions(cliOptions, positionals) {
	const prototypePollutionKeys = [
		"__proto__",
		"constructor",
		"prototype"
	];
	const unflattenedCliOptions = {};
	for (let [key, value] of Object.entries(cliOptions)) if (prototypePollutionKeys.includes(key)) {} else if (key.includes(".")) {
		const [parentKey] = key.split(".");
		unflattenedCliOptions[parentKey] ??= {};
		setNestedProperty(unflattenedCliOptions, key, value);
	} else unflattenedCliOptions[key] = value;
	const [data, errors] = validateCliOptions(unflattenedCliOptions);
	if (errors?.length) {
		errors.forEach((error) => {
			logger.error(`${error}. You can use \`rolldown -h\` to see the help.`);
		});
		process.exit(1);
	}
	const options = data ?? {};
	const result = {
		input: {},
		output: {},
		help: options.help ?? false,
		version: options.version ?? false,
		watch: options.watch ?? false
	};
	if (typeof options.config === "string") result.config = options.config;
	if (options.environment !== void 0) result.environment = options.environment;
	const keysOfInput = getInputCliKeys();
	const keysOfOutput = getOutputCliKeys();
	const reservedKeys = [
		"help",
		"version",
		"config",
		"watch",
		"environment"
	];
	for (let [key, value] of Object.entries(options)) {
		const [primary] = key.split(".");
		if (keysOfInput.includes(primary)) setNestedProperty(result.input, key, value);
		else if (keysOfOutput.includes(primary)) setNestedProperty(result.output, key, value);
		else if (!reservedKeys.includes(key)) {
			logger.error(`Unknown option: ${key}`);
			process.exit(1);
		}
	}
	if (!result.config && positionals.length > 0) if (Array.isArray(result.input.input)) result.input.input.push(...positionals);
	else result.input.input = positionals;
	return result;
}

//#endregion
//#region src/cli/arguments/index.ts
const schemaInfo = getCliSchemaInfo();
const options = Object.fromEntries(Object.entries(schemaInfo).filter(([_key, info]) => info.type !== "never").map(([key, info]) => {
	const config = Object.getOwnPropertyDescriptor(alias, key)?.value;
	const result = {
		type: info.type === "boolean" ? "boolean" : "string",
		description: info?.description ?? config?.description ?? "",
		hint: config?.hint
	};
	if (config && config?.abbreviation) result.short = config?.abbreviation;
	if (config && config.reverse) {
		if (result.description.startsWith("enable")) result.description = result.description.replace("enable", "disable");
		else if (!result.description.startsWith("Avoid")) result.description = `disable ${result.description}`;
	}
	key = camelCaseToKebabCase(key);
	return [config?.reverse ? `no-${key}` : key, result];
}));
function parseCliArguments() {
	const { values, tokens, positionals } = parseArgs({
		options,
		tokens: true,
		allowPositionals: true,
		strict: false
	});
	let invalid_options = tokens.filter((token) => token.kind === "option").map((option) => {
		let negative = false;
		if (option.name.startsWith("no-")) {
			const name = kebabCaseToCamelCase(option.name.substring(3));
			if (name in schemaInfo) {
				delete values[option.name];
				option.name = name;
				negative = true;
			}
		}
		delete values[option.name];
		option.name = kebabCaseToCamelCase(option.name);
		let originalInfo = schemaInfo[option.name];
		if (!originalInfo) return {
			name: option.name,
			value: option.value
		};
		let type = originalInfo.type;
		if (type === "string" && typeof option.value !== "string") {
			let opt = option;
			let config = Object.getOwnPropertyDescriptor(alias, opt.name)?.value;
			if (config?.requireValue) {
				logger.error(`Option \`--${camelCaseToKebabCase(opt.name)}\` requires a value but none was provided.`);
				process.exit(1);
			}
			Object.defineProperty(values, opt.name, {
				value: config?.default ?? "",
				enumerable: true,
				configurable: true,
				writable: true
			});
		} else if (type === "object" && typeof option.value === "string") {
			const pairs = option.value.split(",").map((x) => x.split("="));
			if (!values[option.name]) Object.defineProperty(values, option.name, {
				value: {},
				enumerable: true,
				configurable: true,
				writable: true
			});
			for (const [key, value] of pairs) if (key && value) Object.defineProperty(values[option.name], key, {
				value,
				enumerable: true,
				configurable: true,
				writable: true
			});
		} else if (type === "array" && typeof option.value === "string") {
			if (!values[option.name]) Object.defineProperty(values, option.name, {
				value: [],
				enumerable: true,
				configurable: true,
				writable: true
			});
			values[option.name].push(option.value);
		} else if (type === "boolean") Object.defineProperty(values, option.name, {
			value: !negative,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else if (type === "union") {
			let defaultValue = Object.getOwnPropertyDescriptor(alias, option.name)?.value;
			Object.defineProperty(values, option.name, {
				value: option.value ?? defaultValue?.default ?? "",
				enumerable: true,
				configurable: true,
				writable: true
			});
		} else Object.defineProperty(values, option.name, {
			value: option.value ?? "",
			enumerable: true,
			configurable: true,
			writable: true
		});
	}).filter((item) => {
		return item !== void 0;
	});
	invalid_options.sort((a, b) => {
		return a.name.localeCompare(b.name);
	});
	if (invalid_options.length !== 0) {
		let single = invalid_options.length === 1;
		logger.warn(`Option \`${invalid_options.map((item) => item.name).join(",")}\` ${single ? "is" : "are"} unrecognized. We will ignore ${single ? "this" : "those"} option${single ? "" : "s"}.`);
	}
	let rawArgs = {
		...values,
		...invalid_options.reduce((acc, cur) => {
			acc[cur.name] = cur.value;
			return acc;
		}, Object.create(null))
	};
	return {
		...normalizeCliOptions(values, positionals),
		rawArgs
	};
}

//#endregion
//#region src/utils/clear-screen.ts
const CLEAR_SCREEN = "\x1Bc";
function getClearScreenFunction(options) {
	const isTTY = process.stdout.isTTY;
	const isAnyOptionNotAllowingClearScreen = arraify(options).some(({ watch }) => watch === false || watch?.clearScreen === false);
	if (isTTY && !isAnyOptionNotAllowingClearScreen) return () => {
		process.stdout.write(CLEAR_SCREEN);
	};
}

//#endregion
//#region \0@oxc-project+runtime@0.115.0/helpers/usingCtx.js
function _usingCtx() {
	var r = "function" == typeof SuppressedError ? SuppressedError : function(r, e) {
		var n = Error();
		return n.name = "SuppressedError", n.error = r, n.suppressed = e, n;
	}, e = {}, n = [];
	function using(r, e) {
		if (null != e) {
			if (Object(e) !== e) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
			if (r) var o = e[Symbol.asyncDispose || Symbol["for"]("Symbol.asyncDispose")];
			if (void 0 === o && (o = e[Symbol.dispose || Symbol["for"]("Symbol.dispose")], r)) var t = o;
			if ("function" != typeof o) throw new TypeError("Object is not disposable.");
			t && (o = function o() {
				try {
					t.call(e);
				} catch (r) {
					return Promise.reject(r);
				}
			}), n.push({
				v: e,
				d: o,
				a: r
			});
		} else r && n.push({
			d: e,
			a: r
		});
		return e;
	}
	return {
		e,
		u: using.bind(null, !1),
		a: using.bind(null, !0),
		d: function d() {
			var o, t = this.e, s = 0;
			function next() {
				for (; o = n.pop();) try {
					if (!o.a && 1 === s) return s = 0, n.push(o), Promise.resolve().then(next);
					if (o.d) {
						var r = o.d.call(o.v);
						if (o.a) return s |= 2, Promise.resolve(r).then(next, err);
					} else s |= 1;
				} catch (r) {
					return err(r);
				}
				if (1 === s) return t !== e ? Promise.reject(t) : Promise.resolve();
				if (t !== e) throw t;
			}
			function err(n) {
				return t = t !== e ? new r(n, t) : n, next();
			}
			return next();
		}
	};
}

//#endregion
//#region src/cli/commands/bundle.ts
async function bundleWithConfig(configPath, cliOptions, rawArgs = {}) {
	if (cliOptions.watch) {
		process.env.ROLLUP_WATCH = "true";
		process.env.ROLLDOWN_WATCH = "true";
	}
	const config = await loadConfig(configPath);
	const resolvedConfig = typeof config === "function" ? await config(rawArgs) : config;
	if (typeof resolvedConfig !== "object" || resolvedConfig === null) {
		logger.error(`Invalid configuration from ${configPath}: expected object or array, got ${resolvedConfig}`);
		process.exit(1);
	}
	if (cliOptions.watch) await watchInner(resolvedConfig, cliOptions);
	else await bundleInner(resolvedConfig, cliOptions);
}
async function bundleWithCliOptions(cliOptions) {
	try {
		var _usingCtx$1 = _usingCtx();
		if (cliOptions.output.dir || cliOptions.output.file) {
			await (cliOptions.watch ? watchInner : bundleInner)({}, cliOptions);
			return;
		}
		if (cliOptions.watch) {
			logger.error("You must specify `output.dir` to use watch mode");
			process.exit(1);
		}
		const { output: outputs } = await _usingCtx$1.a(await rolldown(cliOptions.input)).generate(cliOptions.output);
		if (outputs.length === 0) {
			logger.error("No output generated");
			process.exit(1);
		}
		for (const file of outputs) {
			if (outputs.length > 1) logger.log(`\n${styleText$1(["cyan", "bold"], `|→ ${file.fileName}:`)}\n`);
			console.log(file.type === "asset" ? file.source : file.code);
		}
	} catch (_) {
		_usingCtx$1.e = _;
	} finally {
		await _usingCtx$1.d();
	}
}
async function watchInner(config, cliOptions) {
	let normalizedConfig = arraify(config).map((option) => {
		return {
			...option,
			...cliOptions.input,
			output: arraify(option.output || {}).map((output) => {
				return {
					...output,
					...cliOptions.output
				};
			})
		};
	});
	const watcher = watch(normalizedConfig);
	onExit((code) => {
		Promise.resolve(watcher.close()).finally(() => {
			process.exit(typeof code === "number" ? code : 0);
		});
		return true;
	});
	const changedFile = [];
	watcher.on("change", (id, event) => {
		if (event.event === "update") changedFile.push(id);
	});
	const clearScreen = getClearScreenFunction(normalizedConfig);
	watcher.on("event", async (event) => {
		switch (event.code) {
			case "START":
				clearScreen?.();
				break;
			case "BUNDLE_START":
				if (changedFile.length > 0) logger.log(`Found ${styleText$1("bold", changedFile.map(relativeId).join(", "))} changed, rebuilding...`);
				changedFile.length = 0;
				break;
			case "BUNDLE_END":
				await event.result.close();
				logger.success(`Rebuilt ${styleText$1("bold", relativeId(event.output[0]))} in ${styleText$1("green", ms(event.duration))}.`);
				break;
			case "ERROR":
				await event.result.close();
				logger.error(event.error);
				break;
			default: break;
		}
	});
	logger.log(`Waiting for changes...`);
}
async function bundleInner(config, cliOptions) {
	const startTime = performance.now();
	const result = [];
	const configList = arraify(config);
	for (const config of configList) {
		const outputList = arraify(config.output || {});
		const build = await rolldown({
			...config,
			...cliOptions.input
		});
		try {
			for (const output of outputList) result.push(await build.write({
				...output,
				...cliOptions.output
			}));
		} finally {
			await build.close();
		}
	}
	result.forEach(printBundleOutputPretty);
	logger.log(``);
	const duration = performance.now() - startTime;
	logger.success(`rolldown v${version} Finished in ${styleText$1("green", ms(duration))}`);
}
function printBundleOutputPretty(output) {
	const outputEntries = collectOutputEntries(output.output);
	printOutputEntries(outputEntries, collectOutputLayoutAdjustmentSizes(outputEntries), "<DIR>");
}
function collectOutputEntries(output) {
	return output.map((chunk) => ({
		type: chunk.type,
		fileName: chunk.fileName,
		size: chunk.type === "chunk" ? Buffer.byteLength(chunk.code) : Buffer.byteLength(chunk.source)
	}));
}
function collectOutputLayoutAdjustmentSizes(entries) {
	let longest = 0;
	let biggestSize = 0;
	for (const entry of entries) {
		if (entry.fileName.length > longest) longest = entry.fileName.length;
		if (entry.size > biggestSize) biggestSize = entry.size;
	}
	const sizePad = displaySize(biggestSize).length;
	return {
		longest,
		biggestSize,
		sizePad
	};
}
const numberFormatter = new Intl.NumberFormat("en", {
	maximumFractionDigits: 2,
	minimumFractionDigits: 2
});
function displaySize(bytes) {
	return `${numberFormatter.format(bytes / 1e3)} kB`;
}
const CHUNK_GROUPS = [{
	type: "asset",
	color: "green"
}, {
	type: "chunk",
	color: "cyan"
}];
function printOutputEntries(entries, sizeAdjustment, distPath) {
	for (const group of CHUNK_GROUPS) {
		const filtered = entries.filter((e) => e.type === group.type);
		if (!filtered.length) continue;
		for (const entry of filtered.sort((a, z) => a.size - z.size)) {
			let log = styleText$1("dim", withTrailingSlash(distPath));
			log += styleText$1(group.color, entry.fileName.padEnd(sizeAdjustment.longest + 2));
			log += styleText$1("dim", entry.type);
			log += styleText$1("dim", ` │ size: ${displaySize(entry.size).padStart(sizeAdjustment.sizePad)}`);
			logger.log(log);
		}
	}
}
function withTrailingSlash(path) {
	if (path[path.length - 1] !== "/") return `${path}/`;
	return path;
}
function ms(duration) {
	return duration < 1e3 ? `${duration.toFixed(2)} ms` : `${(duration / 1e3).toFixed(2)} s`;
}
function relativeId(id) {
	if (!path.isAbsolute(id)) return id;
	return path.relative(path.resolve(), id);
}

//#endregion
//#region src/cli/commands/help.ts
const examples = [
	{
		title: "Bundle with a config file `rolldown.config.mjs`",
		command: "rolldown -c rolldown.config.mjs"
	},
	{
		title: "Bundle the `src/main.ts` to `dist` with `cjs` format",
		command: "rolldown src/main.ts -d dist -f cjs"
	},
	{
		title: "Bundle the `src/main.ts` and handle the `.png` assets to Data URL",
		command: "rolldown src/main.ts -d dist --moduleTypes .png=dataurl"
	},
	{
		title: "Bundle the `src/main.tsx` and minify the output with sourcemap",
		command: "rolldown src/main.tsx -d dist -m -s"
	},
	{
		title: "Create self-executing IIFE using external jQuery as `$` and `_`",
		command: "rolldown src/main.ts -d dist -n bundle -f iife -e jQuery,window._ -g jQuery=$"
	}
];
const notes = [
	"Due to the API limitation, you need to pass `-s` for `.map` sourcemap file as the last argument.",
	"If you are using the configuration, please pass the `-c` as the last argument if you ignore the default configuration file.",
	"CLI options will override the configuration file.",
	"For more information, please visit https://rolldown.rs/."
];
/**
* Generates the CLI help text as a string.
*/
function generateHelpText() {
	const lines = [];
	lines.push(`${styleText$1("gray", `${description} (rolldown v${version})`)}`);
	lines.push("");
	lines.push(`${styleText$1(["bold", "underline"], "USAGE")} ${styleText$1("cyan", "rolldown -c <config>")} or ${styleText$1("cyan", "rolldown <input> <options>")}`);
	lines.push("");
	lines.push(`${styleText$1(["bold", "underline"], "OPTIONS")}`);
	lines.push("");
	lines.push(Object.entries(options).sort(([a], [b]) => {
		if (options[a].short && !options[b].short) return -1;
		if (!options[a].short && options[b].short) return 1;
		if (options[a].short && options[b].short) return options[a].short.localeCompare(options[b].short);
		return a.localeCompare(b);
	}).map(([option, { type, short, hint, description }]) => {
		let optionStr = `  --${option} `;
		option = camelCaseToKebabCase(option);
		if (short) optionStr += `-${short}, `;
		if (type === "string") optionStr += `<${hint ?? option}>`;
		if (description && description.length > 0) description = description[0].toUpperCase() + description.slice(1);
		return styleText$1("cyan", optionStr.padEnd(30)) + description + (description && description?.endsWith(".") ? "" : ".");
	}).join("\n"));
	lines.push("");
	lines.push(`${styleText$1(["bold", "underline"], "EXAMPLES")}`);
	lines.push("");
	examples.forEach(({ title, command }, ord) => {
		lines.push(`  ${ord + 1}. ${title}:`);
		lines.push(`    ${styleText$1("cyan", command)}`);
		lines.push("");
	});
	lines.push(`${styleText$1(["bold", "underline"], "NOTES")}`);
	lines.push("");
	notes.forEach((note) => {
		lines.push(`  * ${styleText$1("gray", note)}`);
	});
	return lines.join("\n");
}
function showHelp() {
	logger.log(generateHelpText());
}

//#endregion
//#region src/cli/version-check.ts
function checkNodeVersion(nodeVersion) {
	const currentVersion = nodeVersion.split(".");
	const major = parseInt(currentVersion[0], 10);
	const minor = parseInt(currentVersion[1], 10);
	return major === 20 && minor >= 19 || major === 22 && minor >= 12 || major > 22;
}

//#endregion
//#region src/cli/index.ts
if (!checkNodeVersion(process$1.versions.node)) logger.warn(`You are using Node.js ${process$1.versions.node}. Rolldown requires Node.js version 20.19+ or 22.12+. Please upgrade your Node.js version.`);
async function main() {
	const { rawArgs, ...cliOptions } = parseCliArguments();
	if (cliOptions.environment) {
		const environment = Array.isArray(cliOptions.environment) ? cliOptions.environment : [cliOptions.environment];
		for (const argument of environment) for (const pair of argument.split(",")) {
			const [key, ...value] = pair.split(":");
			process$1.env[key] = value.length === 0 ? String(true) : value.join(":");
		}
	}
	if (cliOptions.config || cliOptions.config === "") {
		await bundleWithConfig(cliOptions.config, cliOptions, rawArgs);
		return;
	}
	if ("input" in cliOptions.input) {
		await bundleWithCliOptions(cliOptions);
		return;
	}
	if (cliOptions.version) {
		logger.log(`rolldown v${version}`);
		return;
	}
	showHelp();
}
main().catch((err) => {
	logger.error(err);
	process$1.exit(1);
});

//#endregion
export {  };