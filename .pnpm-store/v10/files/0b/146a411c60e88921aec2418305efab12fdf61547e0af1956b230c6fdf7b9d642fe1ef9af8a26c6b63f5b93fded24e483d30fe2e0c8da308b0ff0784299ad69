import { toDependency } from '../../util/input.js';
import { getPackageNameFromFilePath } from '../../util/modules.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Changesets';
const enablers = ['@changesets/cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isRootOnly = true;
const config = ['.changeset/config.json'];
const resolveConfig = config => {
    const inputs = (Array.isArray(config.changelog)
        ? [config.changelog[0]]
        : typeof config.changelog === 'string'
            ? [config.changelog]
            : []).map(id => toDependency(id));
    if (config.$schema?.includes('node_modules/')) {
        const packageName = getPackageNameFromFilePath(config.$schema);
        if (packageName)
            inputs.push(toDependency(packageName));
    }
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    config,
    resolveConfig,
};
export default plugin;
