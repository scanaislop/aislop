import { r as lint } from "./bindings.js";
//#region src-js/cli.ts
let loadPlugin = null, setupRuleConfigs = null, lintFile = null, createWorkspace = null, destroyWorkspace = null, resolvedConfigLoader = null;
/**
* Load a plugin.
*
* Lazy-loads plugins code on first call, so that overhead is skipped if user doesn't use JS plugins.
*
* @param path - Absolute path of plugin file
* @param pluginName - Plugin name (either alias or package name)
* @param pluginNameIsAlias - `true` if plugin name is an alias (takes priority over name that plugin defines itself)
* @param workspaceUri - Workspace URI (`null` in CLI mode, `string` in LSP mode)
* @returns Plugin details or error serialized to JSON string
*/
function loadPluginWrapper(path, pluginName, pluginNameIsAlias, workspaceUri) {
	return loadPlugin === null ? import("./plugins.js").then((mod) => ({loadPlugin, lintFile, setupRuleConfigs} = mod, loadPlugin(path, pluginName, pluginNameIsAlias, workspaceUri))) : loadPlugin(path, pluginName, pluginNameIsAlias, workspaceUri);
}
/**
* Bootstrap configuration options.
*
* Delegates to `setupRuleConfigs`, which was lazy-loaded by `loadPluginWrapper`.
*
* @param optionsJSON - Array of all rule options across all configurations, serialized as JSON
* @returns `null` if success, or error message string
*/
function setupRuleConfigsWrapper(optionsJSON) {
	return setupRuleConfigs(optionsJSON);
}
/**
* Lint a file.
*
* Delegates to `lintFile`, which was lazy-loaded by `loadPluginWrapper`.
*
* @param filePath - Absolute path of file being linted
* @param bufferId - ID of buffer containing file data
* @param buffer - Buffer containing file data, or `null` if buffer with this ID was previously sent to JS
* @param ruleIds - IDs of rules to run on this file
* @param optionsIds - IDs of options to use for rules on this file, in same order as `ruleIds`
* @param settingsJSON - Settings for file, as JSON
* @param globalsJSON - Globals for file, as JSON
* @param workspaceUri - Workspace URI (`null` in CLI mode, `string` in LSP mode)
* @returns Diagnostics or error serialized to JSON string
*/
function lintFileWrapper(filePath, bufferId, buffer, ruleIds, optionsIds, settingsJSON, globalsJSON, workspaceUri) {
	return lintFile(filePath, bufferId, buffer, ruleIds, optionsIds, settingsJSON, globalsJSON, workspaceUri);
}
/**
* Create a new workspace.
*
* Lazy-loads workspace code on first call, so that overhead is skipped if user doesn't use JS plugins.
*
* @param workspace - Workspace URI
* @returns Promise which resolves when workspace is created
*/
function createWorkspaceWrapper(workspace) {
	return createWorkspace === null ? import("./workspace.js").then((mod) => ({createWorkspace, destroyWorkspace} = mod, createWorkspace(workspace))) : Promise.resolve(createWorkspace(workspace));
}
/**
* Destroy a workspace.
*
* Delegates to `destroyWorkspace`, which was lazy-loaded by `createWorkspaceWrapper`.
*
* @param workspace - Workspace URI
* @returns `undefined`
*/
function destroyWorkspaceWrapper(workspace) {
	destroyWorkspace(workspace);
}
/**
* Load JavaScript/TypeScript config files (experimental).
*
* Lazy-loads the js_config module on first call.
* Uses native Node.js TypeScript support to import config files.
*
* @param paths - Array of absolute paths to JavaScript/TypeScript config files
* @returns JSON-stringified result with all configs or error
*/
function loadJsConfigsWrapper(paths) {
	return resolvedConfigLoader === null ? import("./js_config.js").then(({ loadJsConfigs, loadVitePlusConfigs }) => (resolvedConfigLoader = process.env.VP_VERSION ? loadVitePlusConfigs : loadJsConfigs, resolvedConfigLoader(paths))) : resolvedConfigLoader(paths);
}
const args = process.argv.slice(2);
process.stdout.isTTY || (process.stdin._handle?.setBlocking?.(!0), process.stdout._handle?.setBlocking?.(!0)), args.includes("--lsp") && (process.stdout.write = process.stderr.write.bind(process.stderr)), await lint(args, loadPluginWrapper, setupRuleConfigsWrapper, lintFileWrapper, createWorkspaceWrapper, destroyWorkspaceWrapper, loadJsConfigsWrapper) || (process.exitCode = 1);
//#endregion
export {};
