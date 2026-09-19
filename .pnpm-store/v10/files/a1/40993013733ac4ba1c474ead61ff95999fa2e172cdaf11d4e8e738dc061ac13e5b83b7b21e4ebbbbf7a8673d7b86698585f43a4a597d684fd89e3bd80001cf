import { n as __toESM, t as require_binding } from "./shared/binding-Bd04_f8P.mjs";

//#region src/cli/setup-index.ts
var import_binding = /* @__PURE__ */ __toESM(require_binding(), 1);
let isWatchMode = false;
for (let i = 0; i < process.argv.length; i++) {
	const arg = process.argv[i];
	if (arg === "--watch" || arg === "-w") {
		isWatchMode = true;
		break;
	}
}
if (isWatchMode) (0, import_binding.createTokioRuntime)(32);
else (0, import_binding.createTokioRuntime)(4);

//#endregion
export {  };