import { createRequire } from "node:module";
import { createDebug } from "obug";
//#region src/tsc/load-tsc.ts
const require = createRequire(import.meta.url);
const debug = createDebug("rolldown-plugin-dts:load-tsc");
let _ts;
function requireTS(message = "") {
	if (_ts) return _ts;
	try {
		_ts = require("typescript");
		if (debug.enabled) debug(`loaded TypeScript version ${_ts.version} from ${require.resolve("typescript")}`);
		return _ts;
	} catch (cause) {
		throw new Error(`TypeScript is not installed. You should install \`typescript\` package. ${message}`, { cause });
	}
}
//#endregion
export { requireTS as t };
