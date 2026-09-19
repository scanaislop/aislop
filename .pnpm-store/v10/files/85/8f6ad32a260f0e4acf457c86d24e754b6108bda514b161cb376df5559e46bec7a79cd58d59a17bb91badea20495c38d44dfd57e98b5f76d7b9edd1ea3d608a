//#region src-js/workspace/index.ts
/**
* Active workspaces.
* Keyed by workspace URI.
*/
const workspaces = /* @__PURE__ */ new Map();
/**
* Most recent workspace that was used.
*/
let currentWorkspace = null, currentWorkspaceUri = null;
/**
* Create a new workspace.
*/
function createWorkspace(workspaceUri) {
	workspaces.set(workspaceUri, {
		cwd: "",
		allOptions: [],
		rules: [],
		pluginNames: /* @__PURE__ */ new Set()
	}), currentWorkspace = null, currentWorkspaceUri = null;
}
/**
* Destroy a workspace.
* Unloads all plugin data associated with this workspace.
*/
function destroyWorkspace(workspaceUri) {}
/**
* Set the current workspace.
* @param workspace - Workspace object
* @param workspaceUri - Workspace URI
*/
function setCurrentWorkspace(workspace, workspaceUri) {
	currentWorkspace = workspace, currentWorkspaceUri = workspaceUri;
}
//#endregion
export { setCurrentWorkspace as a, destroyWorkspace as i, currentWorkspace as n, workspaces as o, currentWorkspaceUri as r, createWorkspace as t };
