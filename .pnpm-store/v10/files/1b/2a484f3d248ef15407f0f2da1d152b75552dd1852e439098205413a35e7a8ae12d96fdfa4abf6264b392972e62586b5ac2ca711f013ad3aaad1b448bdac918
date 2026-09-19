import { createManifest } from '../util/package-json.js';
export const createScriptParserContext = (chief) => {
    const rawRootManifest = chief.getManifestForWorkspace('.');
    const rootManifest = rawRootManifest ? createManifest(rawRootManifest) : undefined;
    const manifests = new Map();
    const getManifest = (dir) => {
        const workspace = chief.findWorkspaceByFilePath(`${dir}/`);
        if (!workspace)
            return;
        if (!manifests.has(workspace.name)) {
            const manifest = chief.getManifestForWorkspace(workspace.name);
            manifests.set(workspace.name, manifest ? createManifest(manifest) : undefined);
        }
        return manifests.get(workspace.name);
    };
    return { rootManifest, getManifest };
};
