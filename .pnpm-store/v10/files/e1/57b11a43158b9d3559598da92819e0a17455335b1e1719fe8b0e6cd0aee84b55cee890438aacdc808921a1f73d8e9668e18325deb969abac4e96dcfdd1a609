import { join } from './path.js';
const types = ['peerDependencies', 'devDependencies', 'optionalDependencies', 'dependencies'];
export function createWorkspaceGraph(cwd, wsNames, wsPkgNames, wsPackages) {
    const graph = new Map();
    const packagesByPkgName = new Map();
    for (const pkg of wsPackages.values())
        if (pkg.pkgName)
            packagesByPkgName.set(pkg.pkgName, pkg);
    const getWorkspaceDirs = (pkg) => {
        const dirs = new Set();
        for (const type of types) {
            if (pkg.manifest[type]) {
                for (const pkgName in pkg.manifest[type]) {
                    if (wsPkgNames.has(pkgName)) {
                        const wsPackage = packagesByPkgName.get(pkgName);
                        if (wsPackage)
                            dirs.add(wsPackage.dir);
                    }
                }
            }
        }
        return dirs;
    };
    for (const name of wsNames) {
        const pkg = wsPackages.get(name);
        if (pkg)
            graph.set(join(cwd, name), getWorkspaceDirs(pkg));
    }
    return graph;
}
