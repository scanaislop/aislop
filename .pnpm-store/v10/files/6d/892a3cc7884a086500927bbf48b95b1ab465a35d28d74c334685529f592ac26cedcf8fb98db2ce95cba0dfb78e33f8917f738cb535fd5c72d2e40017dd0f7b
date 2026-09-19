import { a as RE_JSON, c as RE_TS, d as filename_to_dts, f as replaceTemplateName, i as RE_JS, l as filename_dts_to, n as RE_DTS, o as RE_NODE_MODULES, p as resolveTemplateFn, r as RE_DTS_MAP, s as RE_ROLLDOWN_RUNTIME, t as RE_CSS, u as filename_js_to_dts } from "./filename-BFg1q_t3.mjs";
import { createContext, globalContext, invalidateContextFile } from "./tsc-context.mjs";
import { t as requireTS } from "./load-tsc-BKULZsrs.mjs";
import { createRequire } from "node:module";
import { createDebug } from "obug";
import { importerId, include } from "rolldown/filter";
import { b, is, isIdentifierName, nameOf, walk, walkAsync } from "yuku-ast";
import { print } from "yuku-codegen";
import { parse } from "yuku-parser";
import { fork, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { ResolverFactory, isolatedDeclarationSync } from "rolldown/experimental";
import { tmpdir } from "node:os";
import { styleText } from "node:util";
import process from "node:process";
import { getTsconfig, readTsconfig } from "get-tsconfig";
import { createResolver } from "dts-resolver";
//#region src/dts-input.ts
function createDtsInputPlugin({ sideEffects }) {
	return {
		name: "rolldown-plugin-dts:dts-input",
		options: sideEffects === false ? (options) => {
			return {
				treeshake: options.treeshake === false ? false : {
					...options.treeshake === true ? {} : options.treeshake,
					moduleSideEffects: false
				},
				...options
			};
		} : void 0,
		outputOptions(options) {
			return {
				...options,
				entryFileNames(chunk) {
					const { entryFileNames } = options;
					if (entryFileNames) {
						const nameTemplate = resolveTemplateFn(entryFileNames, chunk);
						const renderedName = replaceTemplateName(nameTemplate, chunk.name);
						if (RE_DTS.test(renderedName)) return nameTemplate;
						const renderedNameWithD = replaceTemplateName(nameTemplate, `${chunk.name}.d`);
						if (RE_DTS.test(renderedNameWithD)) return renderedNameWithD;
					}
					if (RE_DTS.test(chunk.name)) return chunk.name;
					if (chunk.name.endsWith(".d")) return "[name].ts";
					return "[name].d.ts";
				}
			};
		}
	};
}
//#endregion
//#region src/tsgo.ts
const require$1 = createRequire(import.meta.url);
const debug$5 = createDebug("rolldown-plugin-dts:tsgo");
function isTS70Installed() {
	try {
		const { versionMajorMinor } = require$1("typescript");
		return versionMajorMinor === "7.0";
	} catch {}
	return false;
}
const spawnAsync = (...args) => new Promise((resolve, reject) => {
	const child = spawn(...args);
	child.on("close", () => resolve());
	child.on("error", (error) => reject(error));
});
let tsgoPathCache;
async function getTsgoPathFromNodeModules(logger) {
	if (tsgoPathCache) return tsgoPathCache;
	const pkgName = isTS70Installed() ? "typescript" : "@typescript/native-preview";
	const tsgoPkg = import.meta.resolve(`${pkgName}/package.json`);
	const { default: { version } } = await import(tsgoPkg, { with: { type: "json" } });
	logger.info(`Emit types with ${styleText("underline", `${pkgName}@${version}`)}`);
	const { default: getExePath } = await import(new URL("lib/getExePath.js", tsgoPkg).href);
	return tsgoPathCache = getExePath();
}
async function runTsgo(logger, rootDir, tsconfig, sourcemap, tsgoPath) {
	debug$5("[tsgo] rootDir", rootDir);
	let tsgo;
	if (tsgoPath) {
		tsgo = tsgoPath;
		debug$5("[tsgo] using custom path", tsgo);
	} else {
		tsgo = await getTsgoPathFromNodeModules(logger);
		debug$5("[tsgo] using tsgo from node_modules", tsgo);
	}
	const tsgoDist = await mkdtemp(path.join(tmpdir(), "rolldown-plugin-dts-"));
	debug$5("[tsgo] tsgoDist", tsgoDist);
	const args = [
		"--noEmit",
		"false",
		"--declaration",
		"--emitDeclarationOnly",
		"-p",
		tsconfig,
		"--outDir",
		tsgoDist,
		"--rootDir",
		rootDir,
		"--noCheck",
		...sourcemap ? ["--declarationMap"] : []
	];
	debug$5("[tsgo] args %o", args);
	await spawnAsync(tsgo, args, { stdio: "inherit" });
	return {
		path: tsgoDist,
		async dispose() {
			if (debug$5.enabled) debug$5("[tsgo] skip cleanup of tsgoDist", tsgoDist);
			else {
				debug$5("[tsgo] disposing tsgoDist", tsgoDist);
				await rm(tsgoDist, {
					recursive: true,
					force: true
				}).catch(() => {});
			}
		}
	};
}
//#endregion
//#region src/generate.ts
const debug$4 = createDebug("rolldown-plugin-dts:generate");
const WORKER_URL = "./tsc-worker.mjs";
const EMPTY_STUB = `export {}`;
function createGeneratePlugin({ generator, entry, tsconfig, tsconfigRaw, build, incremental, cwd, oxc, emitDtsOnly, languageContext, parallel, eager, tsgo, newContext, emitJs, sourcemap, logger }) {
	const entryIncludes = entry?.filter((p) => p[0] !== "!");
	const entryIgnores = entry?.filter((p) => p[0] === "!").map((p) => p.slice(1));
	const entryMatcher = entry ? (file) => entryIncludes.some((p) => path.matchesGlob(file, p)) && entryIgnores.every((p) => !path.matchesGlob(file, p)) : void 0;
	const dtsMap = /* @__PURE__ */ new Map();
	/**
	* A map of input id to output file name
	*
	* @example
	*
	* inputAlias = new Map([
	*   ['/absolute/path/to/src/source_file.ts', 'dist/foo/index'],
	* ])
	*/
	const inputAliasMap = /* @__PURE__ */ new Map();
	let tscWorker;
	let tscModule;
	let tscContext;
	let tsgoContext;
	const rootDir = tsconfig ? path.dirname(tsconfig) : cwd;
	return {
		name: "rolldown-plugin-dts:generate",
		async buildStart(options) {
			if (generator === "tsgo") tsgoContext = await runTsgo(logger, rootDir, tsconfig, sourcemap, tsgo.path);
			else if (generator === "tsc") if (parallel) tscWorker = createTscWorker();
			else {
				tscModule = await import("./tsc.mjs");
				if (newContext) tscContext = createContext();
			}
			if (!Array.isArray(options.input)) for (const [name, id] of Object.entries(options.input)) {
				debug$4("resolving input alias %s -> %s", name, id);
				let resolved = await this.resolve(id);
				if (!id.startsWith("./")) resolved ||= await this.resolve(`./${id}`);
				const resolvedId = resolved?.id || id;
				debug$4("resolved input alias %s -> %s", id, resolvedId);
				inputAliasMap.set(resolvedId, name);
			}
		},
		outputOptions(options) {
			return {
				...options,
				entryFileNames(chunk) {
					const { entryFileNames } = options;
					const nameTemplate = resolveTemplateFn(entryFileNames || "[name].js", chunk);
					if (chunk.name.endsWith(".d")) {
						if (RE_DTS.test(nameTemplate)) return replaceTemplateName(nameTemplate, chunk.name.slice(0, -2));
						if (RE_JS.test(nameTemplate)) return nameTemplate.replace(RE_JS, ".$1ts");
					}
					return nameTemplate;
				}
			};
		},
		resolveId(id) {
			if (!dtsMap.has(id)) return;
			debug$4("resolve dts id %s", id);
			return { id };
		},
		transform: {
			order: "pre",
			filter: { id: {
				include: [
					RE_JS,
					RE_TS,
					RE_JSON,
					...languageContext.patterns
				],
				exclude: [
					RE_DTS,
					RE_NODE_MODULES,
					RE_ROLLDOWN_RUNTIME
				]
			} },
			handler(code, id) {
				const jsFile = RE_JS.test(id);
				if (!jsFile || emitJs) {
					const mod = this.getModuleInfo(id);
					const isEntry = entryMatcher ? entryMatcher(path.relative(cwd, id)) : !!mod?.isEntry;
					const dtsId = filename_to_dts(id, languageContext);
					dtsMap.set(dtsId, {
						code,
						id,
						isEntry,
						jsFile
					});
					debug$4("register dts source: %s", id);
					if (isEntry) {
						const name = inputAliasMap.get(id);
						this.emitFile({
							type: "chunk",
							id: dtsId,
							name: name ? `${name}.d` : void 0
						});
					}
				}
				if (emitDtsOnly) {
					if (RE_JSON.test(id)) return "{}";
					return EMPTY_STUB;
				}
			}
		},
		load: {
			filter: { id: {
				include: [RE_DTS],
				exclude: [RE_NODE_MODULES]
			} },
			async handler(dtsId) {
				const module = dtsMap.get(dtsId);
				if (!module) return;
				const { code, id, jsFile } = module;
				if (jsFile && await access(dtsId).then(() => true).catch(() => false)) {
					debug$4("dts file already exists for %s, skipping generation", id);
					return;
				}
				let dtsCode;
				let map;
				debug$4("generate dts %s from %s", dtsId, id);
				if (generator === "tsgo") {
					if (languageContext.isCustomLanguageFile(id)) throw new Error(`tsgo does not support .${path.extname(id)} file.`);
					const dtsPath = path.resolve(tsgoContext.path, path.relative(path.resolve(rootDir), filename_to_dts(id, languageContext)));
					if (!existsSync(dtsPath)) {
						debug$4("[tsgo]", dtsPath, "is missing");
						throw new Error(`tsgo did not generate dts file for ${id}, please check your tsconfig.`);
					}
					dtsCode = await readFile(dtsPath, "utf8");
					const mapPath = `${dtsPath}.map`;
					if (existsSync(mapPath)) {
						const mapRaw = await readFile(mapPath, "utf8");
						map = {
							...JSON.parse(mapRaw),
							sources: [id]
						};
					}
				} else if (generator === "oxc") {
					const result = isolatedDeclarationSync(languageContext.toTsFilename(id), code, oxc);
					if (result.errors.length) {
						const [error] = result.errors;
						return this.error({
							message: error.message,
							frame: error.codeframe || void 0
						});
					}
					dtsCode = result.code;
					if (result.map) {
						map = result.map;
						map.sources = [id];
						map.sourcesContent = void 0;
					}
				} else {
					const options = {
						tsconfig,
						tsconfigRaw,
						build,
						incremental,
						cwd,
						entries: eager ? void 0 : Array.from(dtsMap.values()).filter((v) => v.isEntry).map((v) => v.id),
						id,
						sourcemap,
						languageContext,
						context: tscContext
					};
					let result;
					if (parallel) result = await tscWorker.emit(options);
					else result = tscModule.tscEmit(options);
					if (result.error) return this.error(result.error);
					dtsCode = result.code;
					map = result.map;
					if (dtsCode && RE_JSON.test(id)) if (dtsCode.includes("declare const _exports")) {
						if (dtsCode.includes("declare const _exports: {") && !dtsCode.includes("\n}[];")) {
							const exports = collectJsonExports(dtsCode);
							let i = 0;
							dtsCode += exports.map((e) => {
								const valid = `_${e.replaceAll(/[^\w$]/g, "_")}${i++}`;
								const jsonKey = JSON.stringify(e);
								return `declare let ${valid}: typeof _exports[${jsonKey}]\nexport { ${valid} as ${jsonKey} }`;
							}).join("\n");
						}
					} else {
						const exportMap = collectJsonExportMap(dtsCode);
						dtsCode += `
declare namespace __json_default_export {
  export { ${Array.from(exportMap.entries(), ([exported, local]) => exported === local ? exported : `${local} as ${exported}`).join(", ")} }
}
export { __json_default_export as default }`;
					}
				}
				return {
					code: dtsCode || "",
					map
				};
			}
		},
		generateBundle: emitDtsOnly ? (options, bundle) => {
			for (const fileName of Object.keys(bundle)) if (bundle[fileName].type === "chunk" && !RE_DTS.test(fileName) && !RE_DTS_MAP.test(fileName)) delete bundle[fileName];
		} : void 0,
		async buildEnd() {
			tscWorker?.kill();
			tscWorker = void 0;
			await tsgoContext?.dispose();
			tsgoContext = void 0;
			if (newContext) tscContext = void 0;
		},
		watchChange(id) {
			if (tscModule) invalidateContextFile(tscContext || globalContext, id);
		}
	};
}
function createTscWorker() {
	const childProcess = fork(new URL(WORKER_URL, import.meta.url), {
		stdio: "inherit",
		serialization: "advanced"
	});
	const pending = /* @__PURE__ */ new Map();
	let nextId = 0;
	childProcess.on("message", (response) => {
		const handler = pending.get(response.id);
		if (!handler) return;
		pending.delete(response.id);
		if (response.error) handler.reject(response.error);
		else handler.resolve(response.result);
	});
	childProcess.on("exit", (code) => {
		for (const handler of pending.values()) handler.reject(/* @__PURE__ */ new Error(`tsc worker exited with code ${code}`));
		pending.clear();
	});
	return {
		emit: (options) => new Promise((resolve, reject) => {
			const id = nextId++;
			pending.set(id, {
				resolve,
				reject
			});
			childProcess.send({
				id,
				options
			});
		}),
		kill: () => childProcess.kill()
	};
}
function collectJsonExportMap(code) {
	const exportMap = /* @__PURE__ */ new Map();
	const { program } = parse(code, {
		sourceType: "module",
		lang: "dts"
	});
	for (const decl of program.body) if (decl.type === "ExportNamedDeclaration") {
		if (decl.declaration) {
			if (decl.declaration.type === "VariableDeclaration") {
				for (const vdecl of decl.declaration.declarations) if (vdecl.id.type === "Identifier") exportMap.set(vdecl.id.name, vdecl.id.name);
			} else if (decl.declaration.type === "TSModuleDeclaration" && decl.declaration.id.type === "Identifier") exportMap.set(decl.declaration.id.name, decl.declaration.id.name);
		} else if (decl.specifiers.length) {
			for (const spec of decl.specifiers) if (spec.type === "ExportSpecifier" && spec.exported.type === "Identifier") exportMap.set(spec.exported.name, spec.local.type === "Identifier" ? spec.local.name : spec.exported.name);
		}
	}
	return exportMap;
}
/** `declare const _exports` mode */
function collectJsonExports(code) {
	const exports = [];
	const { program } = parse(code, {
		sourceType: "module",
		lang: "dts"
	});
	const members = program.body[0].declarations[0].id.typeAnnotation.typeAnnotation.members;
	for (const member of members) if (member.key.type === "Identifier") exports.push(member.key.name);
	else if (is.StringLiteral(member.key)) exports.push(member.key.value);
	return exports;
}
//#endregion
//#region src/fake-js.ts
function createFakeJsPlugin({ sourcemap, cjsDefault, sideEffects }) {
	let declarationIdx = 0;
	const declarationMap = /* @__PURE__ */ new Map();
	const commentsMap = /* @__PURE__ */ new Map();
	const moduleExportsMap = /* @__PURE__ */ new Map();
	const warnedCjsDtsInputs = /* @__PURE__ */ new Set();
	return {
		name: "rolldown-plugin-dts:fake-js",
		outputOptions(options) {
			if (options.format === "cjs" || options.format === "commonjs") throw new Error("[rolldown-plugin-dts] Cannot bundle dts files with `cjs` format.");
			const { chunkFileNames, entryFileNames } = options;
			return {
				...options,
				sourcemap: options.sourcemap || sourcemap,
				chunkFileNames(chunk) {
					const nameTemplate = resolveTemplateFn(chunk.isEntry ? entryFileNames || "[name].js" : chunkFileNames || "[name]-[hash].js", chunk);
					if (chunk.name.endsWith(".d")) {
						const renderedNameWithoutD = filename_js_to_dts(replaceTemplateName(nameTemplate, chunk.name.slice(0, -2)));
						if (RE_DTS.test(renderedNameWithoutD)) return renderedNameWithoutD;
						const renderedName = filename_js_to_dts(replaceTemplateName(nameTemplate, chunk.name));
						if (RE_DTS.test(renderedName)) return renderedName;
					}
					return nameTemplate;
				}
			};
		},
		transform: {
			filter: { id: RE_DTS },
			handler: transform
		},
		renderChunk,
		generateBundle(options, bundle) {
			for (const chunk of Object.values(bundle)) {
				if (!RE_DTS_MAP.test(chunk.fileName)) continue;
				if (sourcemap) {
					if (chunk.type === "chunk" || typeof chunk.source !== "string") continue;
					const map = JSON.parse(chunk.source);
					map.sourcesContent = void 0;
					chunk.source = JSON.stringify(map);
				} else delete bundle[chunk.fileName];
			}
		}
	};
	async function transform(code, id) {
		let file;
		try {
			file = parse(code, {
				lang: "dts",
				sourceType: "module",
				attachComments: true
			});
		} catch (error) {
			throw new Error(`Failed to parse ${id}. This may be caused by a syntax error in the declaration file or a bug in the plugin. Please report this issue to https://github.com/sxzz/rolldown-plugin-dts\n${error}`, { cause: error });
		}
		const { program } = file;
		moduleExportsMap.set(id, await collectModuleExports(this, program.body, id));
		const identifierMap = Object.create(null);
		if (!warnedCjsDtsInputs.has(id) && program.body.some(isCjsDtsInputSyntax)) {
			warnedCjsDtsInputs.add(id);
			this.warn(`${id} uses CommonJS dts syntax. ${RE_NODE_MODULES.test(id) ? `CommonJS dts modules cannot be bundled by rolldown-plugin-dts. Please mark this module as external in your Rolldown config.` : `rolldown-plugin-dts does not support bundling CommonJS dts input.`}`);
		}
		const directives = collectReferenceDirectives(file.comments);
		if (directives.length) commentsMap.set(id, directives);
		const appendStmts = [];
		const namespaceStmts = /* @__PURE__ */ new Map();
		for (const [i, stmt] of program.body.entries()) {
			const setStmt = (stmt) => program.body[i] = stmt;
			if (rewriteImportExport(stmt, setStmt)) continue;
			const sideEffect = stmt.type === "TSModuleDeclaration" && stmt.kind !== "namespace";
			if (sideEffect && stmt.type === "TSModuleDeclaration" && is.StringLiteral(stmt.id) && stmt.id.value[0] === ".") this.warn(`\`declare module ${JSON.stringify(stmt.id.value)}\` will be kept as-is in the output. Relative module declaration may cause unexpected issues. Found in ${id}.`);
			const isDefaultExport = stmt.type === "ExportDefaultDeclaration";
			const isExportDecl = is.oneOf(stmt, ["ExportNamedDeclaration", "ExportDefaultDeclaration"]) && !!stmt.declaration;
			const decl = isExportDecl ? stmt.declaration : stmt;
			const setDecl = isExportDecl ? (decl) => stmt.declaration = decl : setStmt;
			if (decl.type !== "TSDeclareFunction" && !is.Declaration(decl)) continue;
			if (is.oneOf(decl, [
				"TSEnumDeclaration",
				"ClassDeclaration",
				"FunctionDeclaration",
				"TSDeclareFunction",
				"TSModuleDeclaration",
				"VariableDeclaration"
			])) decl.declare = true;
			const bindings = [];
			if (decl.type === "VariableDeclaration") bindings.push(...decl.declarations.map((decl) => decl.id));
			else if ("id" in decl && decl.id) {
				let binding = decl.id;
				if (binding.type === "TSQualifiedName") binding = getIdFromTSEntityName(binding);
				if (sideEffect) binding = b.Identifier({ name: `_${getIdentifierIndex(identifierMap, "")}` });
				if (binding.type !== "Identifier") throw new Error(`Unexpected ${binding.type} declaration id`);
				bindings.push(binding);
			} else {
				const binding = b.Identifier({ name: "export_default" });
				bindings.push(binding);
				decl.id = binding;
			}
			const params = collectParams(decl);
			const childrenSet = /* @__PURE__ */ new Set();
			const deps = await collectDependencies(this, decl, id, namespaceStmts, childrenSet, identifierMap);
			const children = Array.from(childrenSet).filter((child) => bindings.every((b) => child !== b));
			if (decl !== stmt) decl.comments = stmt.comments;
			const declarationId = registerDeclaration({
				decl,
				deps,
				bindings,
				params,
				children
			});
			const declarationIdNode = b.Literal({
				value: declarationId,
				raw: String(declarationId)
			});
			const depsBody = b.ArrayExpression({ elements: deps });
			const depsNode = b.ArrowFunctionExpression({
				id: null,
				generator: false,
				async: false,
				params: params.map(({ name }) => b.Identifier({ name })),
				body: depsBody,
				expression: true
			});
			const childrenNode = b.ArrayExpression({ elements: children.map((node) => b.Literal({
				value: "",
				raw: "\"\"",
				start: node.start,
				end: node.end
			})) });
			const sideEffectNode = sideEffect && b.CallExpression({
				callee: b.Identifier({ name: "sideEffect" }),
				arguments: [bindings[0]],
				optional: false
			});
			const runtimeArrayNode = runtimeBindingArrayExpression([
				declarationIdNode,
				depsNode,
				childrenNode,
				...sideEffectNode ? [sideEffectNode] : []
			]);
			const runtimeAssignment = b.VariableDeclaration({
				kind: "var",
				declarations: [b.VariableDeclarator({
					id: b.ArrayPattern({ elements: bindings.map((binding) => ({
						...binding,
						typeAnnotation: null
					})) }),
					init: runtimeArrayNode
				})]
			});
			if (isDefaultExport) {
				appendStmts.push(b.ExportNamedDeclaration({
					declaration: null,
					specifiers: [b.ExportSpecifier({
						local: bindings[0],
						exported: b.Identifier({ name: "default" })
					})],
					source: null,
					attributes: []
				}));
				setStmt(runtimeAssignment);
			} else setDecl(runtimeAssignment);
		}
		if (sideEffects) appendStmts.push(b.ExpressionStatement({ expression: b.CallExpression({
			callee: b.Identifier({ name: "sideEffect" }),
			arguments: [],
			optional: false
		}) }));
		program.body = [
			...Array.from(namespaceStmts.values(), ({ stmt }) => stmt),
			...program.body,
			...appendStmts
		];
		const result = print(program, {
			comments: false,
			...sourcemap && { sourceMaps: {
				source: code,
				sourceFileName: id
			} }
		});
		return {
			code: result.code,
			map: result.map ?? null
		};
	}
	function renderChunk(code, chunk) {
		if (!RE_DTS.test(chunk.fileName)) return;
		const exportInfo = collectChunkExportInfo(chunk, moduleExportsMap);
		let file;
		try {
			file = parse(code, {
				lang: "ts",
				sourceType: "module",
				attachComments: true
			});
		} catch (error) {
			throw new Error(`Failed to parse generated code for chunk ${chunk.fileName}. This may be caused by a bug in the plugin. Please report this issue to https://github.com/sxzz/rolldown-plugin-dts\n${error}`, { cause: error });
		}
		const { program } = file;
		program.body = patchTsNamespace(program.body);
		program.body = patchReExport(program.body);
		program.body = program.body.map((node) => {
			if (isHelperImport(node)) return null;
			if (node.type === "ExpressionStatement") return null;
			const newNode = patchImportExport(node, exportInfo, cjsDefault);
			if (newNode || newNode === false) return newNode;
			if (node.type !== "VariableDeclaration") return node;
			if (!isRuntimeBindingVariableDeclaration(node)) return null;
			const decl = node.declarations[0];
			const [declarationIdNode, depsFn, children] = decl.init.elements;
			const declarationId = declarationIdNode.value;
			const declaration = getDeclaration(declarationId);
			if (sourcemap) walk(declaration.decl, { enter(node) {
				node.start = void 0;
				node.end = void 0;
			} });
			for (const [i, id] of decl.id.elements.entries()) {
				const transformedBinding = {
					...id,
					typeAnnotation: declaration.bindings[i].typeAnnotation
				};
				overwriteNode(declaration.bindings[i], transformedBinding);
			}
			if (sourcemap) for (const [i, child] of children.elements.entries()) Object.assign(declaration.children[i], {
				start: child.start,
				end: child.end
			});
			const transformedParams = depsFn.params;
			for (const [i, transformedParam] of transformedParams.entries()) {
				const transformedName = transformedParam.name;
				for (const originalTypeParam of declaration.params[i].typeParams) originalTypeParam.name = transformedName;
			}
			const transformedDeps = depsFn.body.elements;
			for (const [i, originalDep] of declaration.deps.entries()) {
				let transformedDep = transformedDeps[i];
				if (transformedDep.type === "UnaryExpression" && transformedDep.operator === "void") {
					const undefinedDep = b.Identifier({ name: "undefined" });
					undefinedDep.start = transformedDep.start;
					undefinedDep.end = transformedDep.end;
					transformedDep = undefinedDep;
				} else if (isInfer(transformedDep)) transformedDep.name = "__Infer";
				if (originalDep.replace) originalDep.replace(transformedDep);
				else Object.assign(originalDep, transformedDep);
			}
			return inheritNodeComments(node, declaration.decl);
		}).filter((node) => !!node);
		if (program.body.length === 0) return {
			code: EMPTY_STUB,
			map: null
		};
		const comments = /* @__PURE__ */ new Set();
		const commentsValue = /* @__PURE__ */ new Set();
		for (const id of chunk.moduleIds) {
			const preserveComments = commentsMap.get(id);
			if (preserveComments) {
				preserveComments.forEach((c) => {
					const id = c.type + c.value;
					if (commentsValue.has(id)) return;
					commentsValue.add(id);
					comments.add(c);
				});
				commentsMap.delete(id);
			}
		}
		if (comments.size) {
			program.body[0].comments ||= [];
			program.body[0].comments.unshift(...Array.from(comments, (c) => ({
				type: c.type,
				value: c.value,
				position: "before",
				sameLine: false
			})));
		}
		const result = print(program, {
			comments: true,
			...sourcemap && { sourceMaps: {
				source: code,
				sourceFileName: chunk.fileName
			} }
		});
		return {
			code: result.code,
			map: result.map ?? null
		};
	}
	function registerDeclaration(info) {
		const declarationId = declarationIdx++;
		declarationMap.set(declarationId, info);
		return declarationId;
	}
	function getDeclaration(declarationId) {
		return declarationMap.get(declarationId);
	}
}
async function collectModuleExports(context, nodes, id) {
	const info = {
		typeOnlyLocals: /* @__PURE__ */ new Set(),
		exports: /* @__PURE__ */ new Map(),
		reExports: [],
		exportAlls: []
	};
	for (const node of nodes) collectTypeOnlyLocals(node, info.typeOnlyLocals);
	for (const node of nodes) await collectExportInfo(context, node, id, info);
	return info;
}
function collectTypeOnlyLocals(node, typeOnlyLocals) {
	if (node.type !== "ImportDeclaration") return;
	for (const specifier of node.specifiers) if (node.importKind === "type" || "importKind" in specifier && specifier.importKind === "type") typeOnlyLocals.add(specifier.local.name);
}
function collectDeclarationNames(node) {
	if (node.type === "VariableDeclaration") return node.declarations.flatMap((decl) => collectPatternNames(decl.id));
	if ("id" in node && node.id) {
		if (node.id.type !== "Identifier" && node.id.type !== "TSQualifiedName") return [];
		const id = getIdFromTSEntityName(node.id);
		return id.type === "Identifier" ? [id.name] : [];
	}
	return [];
}
function collectPatternNames(node) {
	if (!node) return [];
	if (node.type === "Identifier") return [node.name];
	if (node.type === "RestElement") return collectPatternNames(node.argument);
	if (node.type === "AssignmentPattern") return collectPatternNames(node.left);
	if (node.type === "ArrayPattern") return node.elements.flatMap((element) => collectPatternNames(element));
	if (node.type === "ObjectPattern") return node.properties.flatMap((property) => {
		if (property.type === "RestElement") return collectPatternNames(property.argument);
		return collectPatternNames(property.value);
	});
	return [];
}
function isTypeOnlyExport(node, specifier) {
	return node.exportKind === "type" || specifier.exportKind === "type";
}
async function collectExportInfo(context, node, id, info) {
	if (node.type === "ExportNamedDeclaration") {
		if (node.declaration) {
			for (const name of collectDeclarationNames(node.declaration)) info.exports.set(name, false);
			return;
		}
		const source = await resolveExportSource(context, node.source, id);
		for (const specifier of node.specifiers) {
			const typeOnly = isTypeOnlyExport(node, specifier);
			const exported = nameOf(specifier.exported);
			const local = nameOf(specifier.local);
			if (source) info.reExports.push({
				source,
				local,
				exported,
				typeOnly
			});
			else info.exports.set(exported, typeOnly || info.typeOnlyLocals.has(local));
		}
		return;
	}
	if (node.type === "ExportDefaultDeclaration") {
		info.exports.set("default", false);
		return;
	}
	if (node.type === "ExportAllDeclaration") {
		if (node.exported) {
			info.exports.set(nameOf(node.exported), node.exportKind === "type");
			return;
		}
		info.exportAlls.push({
			source: await resolveExportSource(context, node.source, id),
			rawSource: node.source.value,
			typeOnly: node.exportKind === "type"
		});
	}
}
async function resolveExportSource(context, source, importer) {
	if (!source) return;
	const resolved = await context.resolve(source.value, importer);
	if (!resolved || resolved.external) return;
	return resolved.id;
}
function collectChunkExportInfo(chunk, moduleExportsMap) {
	const exportsByModule = resolveAllModuleExports(moduleExportsMap);
	const roots = chunk.facadeModuleId && moduleExportsMap.has(chunk.facadeModuleId) ? [chunk.facadeModuleId] : chunk.moduleIds;
	const mergedExports = /* @__PURE__ */ new Map();
	const typeOnlyExportAllSources = /* @__PURE__ */ new Set();
	for (const root of roots) {
		const exports = exportsByModule.get(root);
		if (exports) for (const [name, typeOnly] of exports) setExportTypeOnly(mergedExports, name, typeOnly);
		const moduleExports = moduleExportsMap.get(root);
		if (!moduleExports) continue;
		for (const exportAll of moduleExports.exportAlls) {
			if (!exportAll.typeOnly || exportAll.source) continue;
			typeOnlyExportAllSources.add(exportAll.rawSource);
		}
	}
	const typeOnlyNames = /* @__PURE__ */ new Set();
	for (const [name, typeOnly] of mergedExports) if (typeOnly) typeOnlyNames.add(name);
	return {
		typeOnlyNames,
		typeOnlyExportAllSources
	};
}
function resolveAllModuleExports(moduleExportsMap) {
	const exportsByModule = /* @__PURE__ */ new Map();
	for (const [id, info] of moduleExportsMap) exportsByModule.set(id, new Map(info.exports));
	let changed = true;
	while (changed) {
		changed = false;
		for (const [id, info] of moduleExportsMap) {
			const exports = exportsByModule.get(id);
			for (const reExport of info.reExports) {
				const sourceTypeOnly = (reExport.source ? exportsByModule.get(reExport.source) : void 0)?.get(reExport.local) ?? false;
				if (setExportTypeOnly(exports, reExport.exported, reExport.typeOnly || sourceTypeOnly)) changed = true;
			}
			for (const exportAll of info.exportAlls) {
				if (!exportAll.source) continue;
				const sourceExports = exportsByModule.get(exportAll.source);
				if (!sourceExports) continue;
				for (const [name, typeOnly] of sourceExports) {
					if (name === "default") continue;
					if (setExportTypeOnly(exports, name, exportAll.typeOnly || typeOnly)) changed = true;
				}
			}
		}
	}
	return exportsByModule;
}
function setExportTypeOnly(exports, name, typeOnly) {
	const current = exports.get(name);
	if (current === false || current === typeOnly) return false;
	if (current === void 0 || !typeOnly) {
		exports.set(name, typeOnly);
		return true;
	}
	return false;
}
/**
* Collects all TSTypeParameter nodes from the given node and groups them by
* their name. One name can associate with one or more type parameters. These
* names will be used as the parameter name in the generated JavaScript
* dependency function.
*/
function collectParams(node) {
	const typeParams = [];
	walk(node, { leave(node) {
		if ("typeParameters" in node && node.typeParameters?.type === "TSTypeParameterDeclaration") typeParams.push(...node.typeParameters.params.map(({ name }) => name));
	} });
	const paramMap = /* @__PURE__ */ new Map();
	for (const typeParam of typeParams) {
		const name = typeParam.name;
		const group = paramMap.get(name);
		if (group) group.push(typeParam);
		else paramMap.set(name, [typeParam]);
	}
	return Array.from(paramMap, ([name, typeParams]) => ({
		name,
		typeParams
	}));
}
async function collectDependencies(context, node, importer, namespaceStmts, children, identifierMap) {
	const deps = /* @__PURE__ */ new Set();
	const seen = /* @__PURE__ */ new Set();
	const preserveImportTypeCache = /* @__PURE__ */ new Map();
	const inferredStack = [];
	let currentInferred = /* @__PURE__ */ new Set();
	function isInferred(node) {
		return node.type === "Identifier" && currentInferred.has(node.name);
	}
	await walkAsync(node, {
		enter(node) {
			if (node.type !== "TSConditionalType") return;
			const inferred = collectInferredNames(node.extendsType);
			inferredStack.push(inferred);
		},
		async leave(node, path) {
			const { parent } = path;
			if (node.type === "TSConditionalType") inferredStack.pop();
			else if (parent?.type === "TSConditionalType") {
				const trueBranch = parent.trueType === node;
				currentInferred = new Set((trueBranch ? inferredStack : inferredStack.slice(0, -1)).flat());
			} else currentInferred = /* @__PURE__ */ new Set();
			if (node.type === "ExportNamedDeclaration") {
				for (const specifier of node.specifiers) if (specifier.type === "ExportSpecifier") addDependency(specifier.local);
			} else if (node.type === "TSInterfaceDeclaration" && node.extends) for (const heritage of node.extends || []) addDependency(heritage.expression);
			else if (node.type === "ClassDeclaration") {
				if (node.superClass) addDependency(node.superClass);
				if (node.implements) for (const implement of node.implements) addDependency(implement.expression);
			} else if (is.oneOf(node, [
				"Property",
				"PropertyDefinition",
				"TSAbstractPropertyDefinition",
				"MethodDefinition",
				"TSAbstractMethodDefinition",
				"TSPropertySignature",
				"TSMethodSignature"
			])) {
				if (node.computed && isReferenceId(node.key)) addDependency(node.key);
				if ("value" in node && isReferenceId(node.value)) addDependency(node.value);
			} else switch (node.type) {
				case "TSTypeReference":
					addDependency(TSEntityNameToRuntime(node.typeName));
					break;
				case "TSTypeQuery":
					if (seen.has(node.exprName)) return;
					if (node.exprName.type === "TSImportType") break;
					addDependency(TSEntityNameToRuntime(node.exprName));
					break;
				case "TSImportType": {
					seen.add(node);
					const { source, qualifier } = node;
					const resolved = await context.resolve(source.value, importer);
					if (!resolved || !!resolved.external) {
						preserveImportTypeCache.set(source.value, true);
						break;
					}
					const dep = importNamespace(node, qualifier, source, namespaceStmts, identifierMap);
					if (dep) addDependency(dep);
					break;
				}
			}
			if (parent && !deps.has(node) && isChildSymbol(node, parent)) children.add(node);
		}
	});
	return Array.from(deps);
	function addDependency(node) {
		if (isThisExpression(node) || isInferred(node)) return;
		deps.add(node);
	}
}
function importNamespace(node, imported, source, namespaceStmts, identifierMap) {
	const sourceText = source.value.replaceAll(/\W/g, "_");
	const localName = `_$${isIdentifierName(source.value) ? source.value : `${sourceText}${getIdentifierIndex(identifierMap, sourceText)}`}`;
	let local = b.Identifier({ name: localName });
	if (namespaceStmts.has(source.value)) local = namespaceStmts.get(source.value).local;
	else namespaceStmts.set(source.value, {
		stmt: b.ImportDeclaration({
			specifiers: [b.ImportNamespaceSpecifier({ local })],
			source,
			phase: null,
			attributes: []
		}),
		local
	});
	if (imported) {
		const importedLeft = getIdFromTSEntityName(imported);
		if (imported.type === "ThisExpression" || importedLeft.type === "ThisExpression") throw new Error("Cannot import `this` from module.");
		overwriteNode(importedLeft, b.TSQualifiedName({
			left: local,
			right: { ...importedLeft }
		}));
		local = imported;
	}
	let replacement = node;
	if (node.typeArguments) {
		overwriteNode(node, b.TSTypeReference({
			typeName: local,
			typeArguments: node.typeArguments
		}));
		replacement = local;
	} else overwriteNode(node, local);
	return {
		...TSEntityNameToRuntime(local),
		replace(newNode) {
			overwriteNode(replacement, newNode);
		}
	};
}
function isChildSymbol(node, parent) {
	if (node.type === "Identifier") return true;
	if (is.oneOf(parent, ["TSPropertySignature", "TSMethodSignature"]) && parent.key === node) return true;
	return false;
}
function collectInferredNames(node) {
	const inferred = [];
	walk(node, { enter(node) {
		if (node.type === "TSInferType" && node.typeParameter) inferred.push(node.typeParameter.name.name);
	} });
	return inferred;
}
const REFERENCE_RE = /\/\s*<reference\s+(?:path|types)=/;
function collectReferenceDirectives(comment, negative = false) {
	return comment.filter((c) => REFERENCE_RE.test(c.value) !== negative);
}
const SOURCE_MAP_PRAGMA_RE = /^#\s*source(?:Mapping)?URL=/;
function isSourceMapPragma(comment) {
	return SOURCE_MAP_PRAGMA_RE.test(comment.value);
}
function isCjsDtsInputSyntax(node) {
	return node.type === "TSExportAssignment" || node.type === "TSImportEqualsDeclaration" && node.moduleReference.type === "TSExternalModuleReference";
}
/**
* Check if the given node is a {@link RuntimeBindingVariableDeclration}
*/
function isRuntimeBindingVariableDeclaration(node) {
	return node?.type === "VariableDeclaration" && node.declarations.length === 1 && node.declarations[0].type === "VariableDeclarator" && node.declarations[0].id.type === "ArrayPattern" && isRuntimeBindingArrayExpression(node.declarations[0].init);
}
/**
* Check if the given node is a {@link RuntimeBindingArrayExpression}
*/
function isRuntimeBindingArrayExpression(node) {
	return node?.type === "ArrayExpression" && isRuntimeBindingArrayElements(node.elements);
}
/**
* Check if the given array is a {@link RuntimeBindingArrayElements}
*/
function isRuntimeBindingArrayElements(elements) {
	const [declarationId, deps, children, effect] = elements;
	return is.NumericLiteral(declarationId) && deps?.type === "ArrowFunctionExpression" && children?.type === "ArrayExpression" && (!effect || effect.type === "CallExpression");
}
function runtimeBindingArrayExpression(elements) {
	return b.ArrayExpression({ elements: [...elements] });
}
function isThisExpression(node) {
	return is.Identifier(node, "this") || node.type === "ThisExpression" || node.type === "MemberExpression" && isThisExpression(node.object);
}
function isInfer(node) {
	return is.Identifier(node, "infer");
}
function TSEntityNameToRuntime(node) {
	if (node.type === "Identifier" || node.type === "ThisExpression") return node;
	const left = TSEntityNameToRuntime(node.left);
	return Object.assign(node, {
		type: "MemberExpression",
		object: left,
		property: node.right,
		computed: false
	});
}
function getIdFromTSEntityName(node) {
	if (node.type === "Identifier" || node.type === "ThisExpression") return node;
	return getIdFromTSEntityName(node.left);
}
function isReferenceId(node) {
	return is.oneOf(node, ["Identifier", "MemberExpression"]);
}
function isHelperImport(node) {
	return node.type === "ImportDeclaration" && node.specifiers.length && node.specifiers.every((spec) => spec.type === "ImportSpecifier" && spec.imported.type === "Identifier" && ["__exportAll", "__reExport"].includes(spec.local.name));
}
/**
* patch `.d.ts` suffix in import source to `.js`
*/
function patchImportExport(node, exportInfo, cjsDefault) {
	if (node.type === "ExportNamedDeclaration" && !node.declaration && !node.source && !node.specifiers.length && !node.attributes?.length) return false;
	if (node.type === "ImportDeclaration" && node.specifiers.length) {
		for (const specifier of node.specifiers) if (isInfer(specifier.local)) specifier.local.name = "__Infer";
	}
	if (is.oneOf(node, [
		"ImportDeclaration",
		"ExportAllDeclaration",
		"ExportNamedDeclaration"
	])) {
		if (node.type === "ExportAllDeclaration" && node.source && exportInfo.typeOnlyExportAllSources.has(node.source.value)) node.exportKind = "type";
		if (node.type === "ExportNamedDeclaration" && exportInfo.typeOnlyNames.size) {
			for (const spec of node.specifiers) {
				const name = nameOf(spec.exported);
				if (exportInfo.typeOnlyNames.has(name)) if (spec.type === "ExportSpecifier") spec.exportKind = "type";
				else node.exportKind = "type";
			}
			normalizeTypeOnlyExport(node);
		}
		if (node.source?.value && RE_DTS.test(node.source.value)) {
			node.source.value = filename_dts_to(node.source.value, "js");
			return node;
		}
		if (cjsDefault && node.type === "ExportNamedDeclaration" && !node.source && node.specifiers.length === 1 && node.specifiers[0].type === "ExportSpecifier" && nameOf(node.specifiers[0].exported) === "default") {
			const defaultExport = node.specifiers[0];
			return b.TSExportAssignment({ expression: defaultExport.local });
		}
	}
}
function normalizeTypeOnlyExport(node) {
	if (node.declaration || !node.specifiers.length) return;
	for (const specifier of node.specifiers) if (specifier.type !== "ExportSpecifier" || specifier.exportKind !== "type") return;
	node.exportKind = "type";
	for (const specifier of node.specifiers) if (specifier.type === "ExportSpecifier") specifier.exportKind = "value";
}
/**
* Handle `__exportAll` call
*/
function patchTsNamespace(nodes) {
	const removed = /* @__PURE__ */ new Set();
	for (const [i, node] of nodes.entries()) {
		const result = getExportAllNamespace(node);
		if (!result) continue;
		const [binding, exports] = result;
		if (!exports.properties.length) continue;
		const namespaceExport = b.ExportNamedDeclaration({
			declaration: null,
			specifiers: exports.properties.filter((property) => property.type === "Property").map((property) => {
				const local = property.value.body;
				const exported = property.key;
				return b.ExportSpecifier({
					local,
					exported
				});
			}),
			source: null,
			attributes: []
		});
		nodes[i] = b.TSModuleDeclaration({
			id: binding,
			body: b.TSModuleBlock({ body: [namespaceExport] }),
			kind: "namespace",
			declare: true,
			global: false
		});
	}
	return nodes.filter((node) => !removed.has(node));
}
function getExportAllNamespace(node) {
	if (node.type !== "VariableDeclaration" || node.declarations.length !== 1 || node.declarations[0].id.type !== "Identifier" || node.declarations[0].init?.type !== "CallExpression" || node.declarations[0].init.callee.type !== "Identifier" || node.declarations[0].init.callee.name !== "__exportAll" || node.declarations[0].init.arguments.length !== 1 || node.declarations[0].init.arguments[0].type !== "ObjectExpression") return false;
	return [node.declarations[0].id, node.declarations[0].init.arguments[0]];
}
/**
* Handle `__reExport` call
*/
function patchReExport(nodes) {
	const exportsNames = /* @__PURE__ */ new Map();
	for (const [i, node] of nodes.entries()) if (node.type === "ImportDeclaration" && node.specifiers.length === 1 && node.specifiers[0].type === "ImportSpecifier" && node.specifiers[0].local.type === "Identifier" && node.specifiers[0].local.name.endsWith("_exports")) exportsNames.set(node.specifiers[0].local.name, node.specifiers[0].local.name);
	else if (node.type === "ExpressionStatement" && node.expression.type === "CallExpression" && is.Identifier(node.expression.callee, "__reExport")) {
		const args = node.expression.arguments;
		exportsNames.set(args[0].name, args[1].name);
	} else if (node.type === "VariableDeclaration" && node.declarations.length === 1 && node.declarations[0].init?.type === "MemberExpression" && node.declarations[0].init.object.type === "Identifier" && exportsNames.has(node.declarations[0].init.object.name)) nodes[i] = b.TSTypeAliasDeclaration({
		id: b.Identifier({ name: node.declarations[0].id.name }),
		typeParameters: null,
		typeAnnotation: b.TSTypeReference({
			typeName: b.TSQualifiedName({
				left: b.Identifier({ name: exportsNames.get(node.declarations[0].init.object.name) }),
				right: b.Identifier({ name: node.declarations[0].init.property.name })
			}),
			typeArguments: null
		}),
		declare: false
	});
	else if (node.type === "ExportNamedDeclaration" && node.specifiers.length === 1 && node.specifiers[0].type === "ExportSpecifier" && node.specifiers[0].local.type === "Identifier" && exportsNames.has(node.specifiers[0].local.name)) node.specifiers[0].local.name = exportsNames.get(node.specifiers[0].local.name);
	return nodes;
}
function rewriteImportExport(node, set) {
	if (node.type === "ImportDeclaration" || node.type === "ExportNamedDeclaration" && !node.declaration) {
		for (const specifier of node.specifiers) if (specifier.type === "ImportSpecifier") specifier.importKind = "value";
		else if (specifier.type === "ExportSpecifier") specifier.exportKind = "value";
		if (node.type === "ImportDeclaration") node.importKind = "value";
		else if (node.type === "ExportNamedDeclaration") node.exportKind = "value";
		return true;
	} else if (node.type === "ExportAllDeclaration") {
		node.exportKind = "value";
		return true;
	} else if (node.type === "TSImportEqualsDeclaration") {
		if (node.moduleReference.type === "TSExternalModuleReference") set(b.ImportDeclaration({
			specifiers: [b.ImportDefaultSpecifier({ local: node.id })],
			source: node.moduleReference.expression,
			phase: null,
			attributes: []
		}));
		return true;
	} else if (node.type === "TSExportAssignment" && node.expression.type === "Identifier") {
		set(b.ExportNamedDeclaration({
			declaration: null,
			specifiers: [b.ExportSpecifier({
				local: node.expression,
				exported: b.Identifier({ name: "default" })
			})],
			source: null,
			attributes: []
		}));
		return true;
	} else if (node.type === "ExportDefaultDeclaration" && node.declaration.type === "Identifier") {
		set(b.ExportNamedDeclaration({
			declaration: null,
			specifiers: [b.ExportSpecifier({
				local: node.declaration,
				exported: b.Identifier({ name: "default" })
			})],
			source: null,
			attributes: []
		}));
		return true;
	}
	return false;
}
function overwriteNode(node, newNode) {
	for (const key of Object.keys(node)) Reflect.deleteProperty(node, key);
	Object.assign(node, newNode);
	return node;
}
function inheritNodeComments(oldNode, newNode) {
	newNode.comments ||= [];
	const pragmas = oldNode.comments?.filter((comment) => comment.position === "before" && comment.value.startsWith("#") && !isSourceMapPragma(comment));
	if (pragmas) newNode.comments.unshift(...pragmas);
	newNode.comments = newNode.comments.filter((comment) => !REFERENCE_RE.test(comment.value) && !isSourceMapPragma(comment));
	return newNode;
}
function getIdentifierIndex(identifierMap, name) {
	if (name in identifierMap) return ++identifierMap[name];
	return identifierMap[name] = 0;
}
//#endregion
//#region src/custom-language.ts
var LanguageContext = class {
	languages;
	patterns;
	constructor(languages) {
		this.languages = languages;
		this.patterns = languages.flatMap((language) => language.extensionPatterns);
	}
	isCustomLanguageFile(id) {
		return this.patterns.some((pattern) => pattern.test(id));
	}
	isUsingVolar() {
		return this.languages.some((language) => language.volarTypeScript || language.createVolarPlugins);
	}
	getExtraFileExtensions() {
		if (!this.languages.length) return;
		return this.languages.flatMap((language) => language.tsFileExtensionInfos || []);
	}
	getCreateProgram(ts) {
		if (!this.languages.length) return ts.createProgram;
		const volarTypeScript = this.languages.find((language) => language.volarTypeScript)?.volarTypeScript;
		if (!volarTypeScript) return ts.createProgram;
		const { proxyCreateProgram } = volarTypeScript;
		return proxyCreateProgram(ts, ts.createProgram, (ts, options) => {
			const setups = [];
			const plugins = [];
			for (const language of this.languages) {
				if (!language.createVolarPlugins) continue;
				const result = language.createVolarPlugins(ts, options);
				if (Array.isArray(result)) plugins.push(...result);
				else {
					if (result.setup) setups.push(result.setup);
					plugins.push(...result.languagePlugins);
				}
			}
			return {
				setup: setups.length ? (language) => {
					for (const setup of setups) setup(language);
				} : void 0,
				languagePlugins: plugins
			};
		});
	}
	toTsFilename(id) {
		for (const language of this.languages) if (language.toTsFilename && language.extensionPatterns.some((pattern) => pattern.test(id))) return language.toTsFilename(id);
		return id;
	}
};
//#endregion
//#region src/tsc/vue.ts
const require = createRequire(import.meta.url);
const debug$3 = createDebug("rolldown-plugin-dts:vue");
const RE_VUE = /\.vue$/;
function createVueLanguage() {
	const ts = requireTS(`Vue support requires TypeScript to be installed. Please install \`typescript\` package.`);
	const [volarTypeScript, vue] = loadVueLanguageTools();
	const getLanguagePlugin = (ts, options) => {
		const $rootDir = options.options.$rootDir;
		const $configRaw = options.options.$configRaw;
		const resolver = new vue.CompilerOptionsResolver(ts, ts.sys.readFile);
		resolver.addConfig($configRaw?.vueCompilerOptions ?? {}, $rootDir);
		const vueOptions = resolver.build();
		return vue.createVueLanguagePlugin(ts, options.options, vueOptions, (id) => id);
	};
	return {
		extensionPatterns: [RE_VUE],
		tsFileExtensionInfos: [{
			extension: "vue",
			isMixedContent: true,
			scriptKind: ts.ScriptKind.Deferred
		}],
		volarTypeScript,
		createVolarPlugins(ts, options) {
			return [getLanguagePlugin(ts, options)];
		},
		toTsFilename(id) {
			return id.replace(RE_VUE, ".vue.ts");
		}
	};
}
function loadVueLanguageTools() {
	debug$3("loading vue language tools");
	try {
		const vueTscPath = require.resolve("vue-tsc");
		return [require(require.resolve("@volar/typescript", { paths: [vueTscPath] })), require(require.resolve("@vue/language-core", { paths: [vueTscPath] }))];
	} catch (cause) {
		debug$3("vue language tools not found", cause);
		throw new Error("Failed to load vue language tools. Please manually install vue-tsc.", { cause });
	}
}
//#endregion
//#region src/options.ts
const debug$2 = createDebug("rolldown-plugin-dts:options");
let warnedTsgo = false;
function resolveOptions({ generator, entry, cwd = process.cwd(), dtsInput = false, emitDtsOnly = false, tsconfig, tsconfigRaw: overriddenTsconfigRaw = {}, compilerOptions = {}, sourcemap, resolver = "oxc", cjsDefault = false, sideEffects = false, logger = console, customLanguages, build = false, incremental = false, vue = false, parallel = false, eager = false, newContext = false, emitJs, oxc, tsgo }) {
	let resolvedTsconfig;
	if (tsconfig === true || tsconfig == null) {
		const { config, path } = getTsconfig(cwd) || {};
		tsconfig = path;
		resolvedTsconfig = config;
	} else if (typeof tsconfig === "string") {
		tsconfig = path.resolve(cwd || process.cwd(), tsconfig);
		resolvedTsconfig = readTsconfig(tsconfig).config;
	} else tsconfig = void 0;
	compilerOptions = {
		...resolvedTsconfig?.compilerOptions,
		...compilerOptions
	};
	incremental ||= compilerOptions.incremental || !!compilerOptions.tsBuildInfoFile;
	sourcemap ??= !!compilerOptions.declarationMap;
	compilerOptions.declarationMap = sourcemap;
	const tsconfigRaw = {
		...resolvedTsconfig,
		...overriddenTsconfigRaw,
		compilerOptions
	};
	customLanguages ||= [];
	if (vue) customLanguages.push(createVueLanguage());
	const languageContext = new LanguageContext(customLanguages);
	if (customLanguages.length) {
		if (languageContext.isUsingVolar()) {
			if (isTS70Installed()) throw new Error("TypeScript 7.0 does not yet have a stable API and is experimental. Volar-based custom languages (including the `vue` option) are not yet supported with TypeScript 7.0.");
			if (generator && generator !== "tsc") logger.warn("Volar-based custom languages (including the `vue` option) require the `tsc` generator. The `generator` option is ignored.");
			generator = "tsc";
		} else if (generator === "tsgo") {
			logger.warn("The `tsgo` generator does not support custom languages. The `generator` option is ignored.");
			generator = void 0;
		} else if (!generator && tsgo) logger.warn("The `tsgo` generator does not support custom languages. The `tsgo` option is ignored.");
	}
	if (!generator) if (tsgo && !customLanguages.length) generator = "tsgo";
	else if (oxc || compilerOptions?.isolatedDeclarations) generator = "oxc";
	else if (isTS70Installed()) {
		if (customLanguages.length) throw new Error("Custom languages are not supported with TypeScript 7.0.");
		generator = "tsgo";
	} else generator = "tsc";
	if (generator === "tsc") requireTS("Or enable `isolatedDeclarations` in your `tsconfig.json` to use Oxc instead.");
	else if (generator === "tsgo") {
		if (!tsconfig) throw new Error("tsgo generator requires a tsconfig file to be specified.");
		if (!warnedTsgo) {
			warnedTsgo = true;
			logger.warn("TypeScript 7.0 does not yet have a stable API and is experimental. Some options will be unavailable.");
		}
	}
	if (oxc === true || !oxc) oxc = {};
	if (oxc) {
		oxc.stripInternal ??= !!compilerOptions?.stripInternal;
		oxc.sourcemap = !!compilerOptions.declarationMap;
	}
	if (tsgo === true || !tsgo) tsgo = {};
	emitJs ??= !!(compilerOptions.checkJs || compilerOptions.allowJs);
	const resolved = {
		generator,
		entry: entry ? Array.isArray(entry) ? entry : [entry] : void 0,
		cwd,
		dtsInput,
		emitDtsOnly,
		tsconfig,
		tsconfigRaw,
		sourcemap,
		resolver,
		cjsDefault,
		sideEffects,
		build,
		incremental,
		parallel,
		eager,
		newContext,
		emitJs,
		languageContext,
		oxc,
		tsgo,
		logger
	};
	debug$2("Resolved Options: %O", resolved);
	return resolved;
}
//#endregion
//#region src/resolver.ts
const debug$1 = createDebug("rolldown-plugin-dts:resolver");
function createDtsResolvePlugin({ cwd, tsconfig, tsconfigRaw, resolver, sideEffects, languageContext }) {
	function isSourceFile(id) {
		return RE_TS.test(id) || RE_JSON.test(id) || languageContext.isCustomLanguageFile(id);
	}
	const baseDtsResolver = createResolver({
		tsconfig,
		resolveNodeModules: true,
		ResolverFactory
	});
	const moduleSideEffects = sideEffects ? true : null;
	return {
		name: "rolldown-plugin-dts:resolver",
		resolveId: {
			order: "pre",
			filter: [include(importerId(RE_DTS))],
			async handler(id, importer, options) {
				if (!importer) return;
				const external = {
					id,
					external: true,
					moduleSideEffects: sideEffects
				};
				const rolldownResolution = await this.resolve(id, importer, options);
				debug$1("Rolldown resolution for dts import %O from %O: %O", id, importer, rolldownResolution);
				if (rolldownResolution?.external) {
					debug$1("Rolldown marked dts import as external:", id);
					return rolldownResolution;
				}
				const dtsResolution = await resolveDtsPath(id, importer, rolldownResolution);
				debug$1("Dts resolution for dts import %O from %O: %O", id, importer, dtsResolution);
				if (!dtsResolution) {
					if (RE_CSS.test(id)) {
						debug$1("Externalizing css import:", id);
						return external;
					}
					debug$1("Unresolvable dts import:", id, "from", importer);
					return isFilePath(id) ? null : external;
				}
				if (RE_DTS.test(dtsResolution)) {
					debug$1("Resolving dts import to declaration file:", id);
					return {
						id: dtsResolution,
						moduleSideEffects
					};
				}
				if (isSourceFile(dtsResolution)) {
					debug$1("Resolving dts import to source file:", id);
					await this.load({ id: dtsResolution });
					return {
						id: filename_to_dts(dtsResolution, languageContext),
						moduleSideEffects
					};
				}
			}
		}
	};
	async function resolveDtsPath(id, importer, rolldownResolution) {
		let dtsPath;
		if (resolver === "tsc") {
			const { tscResolve } = await import("./resolver-cwLsPb2o.mjs");
			dtsPath = tscResolve(id, importer, cwd, tsconfig, tsconfigRaw);
		} else dtsPath = baseDtsResolver(id, importer);
		debug$1("Using %s for dts import: %O -> %O", resolver, id, dtsPath);
		if (dtsPath) dtsPath = path.normalize(dtsPath);
		if (!dtsPath || !isSourceFile(dtsPath)) {
			if (rolldownResolution && isFilePath(rolldownResolution.id) && isSourceFile(rolldownResolution.id) && !rolldownResolution.external) return rolldownResolution.id;
			return null;
		}
		return dtsPath;
	}
}
function isFilePath(id) {
	return id.startsWith(".") || path.isAbsolute(id);
}
//#endregion
//#region src/index.ts
const debug = createDebug("rolldown-plugin-dts:options");
function dts(options = {}) {
	debug("resolving dts options");
	const resolved = resolveOptions(options);
	debug("resolved dts options %o", resolved);
	const plugins = [];
	if (options.dtsInput) plugins.push(createDtsInputPlugin(resolved));
	else plugins.push(createGeneratePlugin(resolved));
	plugins.push(createDtsResolvePlugin(resolved), createFakeJsPlugin(resolved));
	return plugins;
}
//#endregion
export { createFakeJsPlugin, createGeneratePlugin, dts, resolveOptions };
