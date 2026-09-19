import { t as requireTS } from "./load-tsc-BKULZsrs.mjs";
import { createDebug } from "obug";
import path from "node:path";
//#region src/tsc/resolver.ts
const debug = createDebug("rolldown-plugin-dts:tsc-resolver");
const ts = requireTS();
function tscResolve(id, importer, cwd, tsconfig, tsconfigRaw, reference) {
	const baseDir = tsconfig ? path.dirname(tsconfig) : cwd;
	const parsedConfig = ts.parseJsonConfigFileContent(tsconfigRaw, ts.sys, baseDir);
	const resolved = ts.bundlerModuleNameResolver(id, importer, {
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		...parsedConfig.options
	}, ts.sys, void 0, reference);
	debug(`tsc resolving id "%s" from "%s" -> %O`, id, importer, resolved.resolvedModule);
	return resolved.resolvedModule?.resolvedFileName;
}
//#endregion
export { tscResolve };
