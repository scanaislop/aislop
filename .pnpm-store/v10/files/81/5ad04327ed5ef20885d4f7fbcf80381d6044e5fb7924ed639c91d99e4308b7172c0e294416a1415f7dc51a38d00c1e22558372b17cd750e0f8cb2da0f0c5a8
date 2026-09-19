import { ROOT_WORKSPACE_NAME } from '../constants.js';
import { join } from './path.js';
export const createWorkspaceFilePathFilter = (cwd, selectedWorkspaces, availableWorkspaceNames) => {
    if (!selectedWorkspaces || !availableWorkspaceNames)
        return () => true;
    const includeRoot = selectedWorkspaces.has(ROOT_WORKSPACE_NAME);
    const workspaceDirs = availableWorkspaceNames
        .filter(name => name !== ROOT_WORKSPACE_NAME)
        .map(name => ({ name, dir: join(cwd, name) }))
        .sort((a, b) => b.name.split('/').length - a.name.split('/').length);
    return (filePath) => {
        const match = workspaceDirs.find(ws => filePath.startsWith(`${ws.dir}/`));
        if (match)
            return selectedWorkspaces.has(match.name);
        return includeRoot;
    };
};
