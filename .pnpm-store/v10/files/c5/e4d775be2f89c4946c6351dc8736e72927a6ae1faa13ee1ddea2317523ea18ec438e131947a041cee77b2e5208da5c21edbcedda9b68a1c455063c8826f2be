import { RUNTIME_MODULE_ID } from "rolldown";
import { exactRegex } from "rolldown/filter";
//#region src/filename.ts
const RE_JS = /\.([cm]?)jsx?$/;
const RE_TS = /\.([cm]?)tsx?$/;
const RE_DTS = /\.d\.([cm]?)ts$/;
const RE_DTS_MAP = /\.d\.([cm]?)ts\.map$/;
const RE_NODE_MODULES = /[\\/]node_modules[\\/]/;
const RE_CSS = /\.(?:css|scss|sass|less|styl|stylus)$/;
const RE_JSON = /\.json$/;
const RE_ROLLDOWN_RUNTIME = exactRegex(RUNTIME_MODULE_ID);
function filename_js_to_dts(id) {
	return id.replace(RE_JS, ".d.$1ts");
}
function filename_to_dts(id, languageContext) {
	id = languageContext?.toTsFilename?.(id) ?? id;
	return id.replace(RE_TS, ".d.$1ts").replace(RE_JS, ".d.$1ts").replace(RE_JSON, ".json.d.ts");
}
function filename_dts_to(id, ext) {
	return id.replace(RE_DTS, `.$1${ext}`);
}
function resolveTemplateFn(fn, chunk) {
	return typeof fn === "function" ? fn(chunk) : fn;
}
function replaceTemplateName(template, name) {
	return template.replaceAll("[name]", name);
}
//#endregion
export { RE_JSON as a, RE_TS as c, filename_to_dts as d, replaceTemplateName as f, RE_JS as i, filename_dts_to as l, RE_DTS as n, RE_NODE_MODULES as o, resolveTemplateFn as p, RE_DTS_MAP as r, RE_ROLLDOWN_RUNTIME as s, RE_CSS as t, filename_js_to_dts as u };
