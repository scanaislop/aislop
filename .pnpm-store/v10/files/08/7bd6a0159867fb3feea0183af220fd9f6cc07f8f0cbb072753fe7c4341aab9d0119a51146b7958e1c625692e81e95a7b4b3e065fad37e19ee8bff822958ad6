import { resolvePackageManifestPath } from '../util/resolve.js';
import { _require } from '../util/require.js';
export const loadPackageManifest = ({ dir, packageName }) => {
    const manifestPath = resolvePackageManifestPath(packageName, dir);
    if (!manifestPath)
        return;
    try {
        return _require(manifestPath);
    }
    catch { }
};
export const getFilteredScripts = (scripts) => {
    if (!scripts)
        return [{}, {}];
    const productionScripts = {};
    const developmentScripts = {};
    for (const scriptName in scripts) {
        if (!/^\w/.test(scriptName))
            continue;
        if (scriptName === 'start')
            productionScripts[scriptName] = scripts[scriptName];
        else
            developmentScripts[scriptName] = scripts[scriptName];
    }
    return [productionScripts, developmentScripts];
};
