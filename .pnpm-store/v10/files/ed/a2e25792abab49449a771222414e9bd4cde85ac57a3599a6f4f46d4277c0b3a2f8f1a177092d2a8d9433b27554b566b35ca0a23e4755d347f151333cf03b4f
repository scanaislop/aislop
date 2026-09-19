import { a as loadPlugin, n as lintFile, u as setOptions } from "./lint.js";
import { t as getErrorMessage } from "./utils.js";
//#region src-js/plugins/config.ts
/**
* Populates Rust-resolved configuration options on the JS side.
* Called from Rust side after all configuration options have been resolved.
*
* Note: the name `setupRuleConfigs` is currently incorrect, as we only populate rule options.
* The intention is for this function to transfer all configurations in a multi-config workspace.
* The configuration relevant to each file would then be resolved on the JS side.
*
* @param optionsJSON - Array of all rule options across all configurations, serialized as JSON
* @returns `null` if success, or error message string
*/
function setupRuleConfigs(optionsJSON) {
	try {
		return setOptions(optionsJSON), null;
	} catch (err) {
		return getErrorMessage(err);
	}
}
//#endregion
export { lintFile, loadPlugin, setupRuleConfigs };
