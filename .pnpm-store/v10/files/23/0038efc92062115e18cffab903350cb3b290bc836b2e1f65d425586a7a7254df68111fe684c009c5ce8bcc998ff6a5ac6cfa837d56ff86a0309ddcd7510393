import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
const title = 'npm-package-json-lint';
const enablers = ['npm-package-json-lint'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const packageJsonPath = 'npmpackagejsonlint';
const config = ['package.json', ...toCosmiconfig('npmpackagejsonlint')];
const resolveConfig = localConfig => {
    return localConfig?.extends ? [localConfig.extends].map(id => toDependency(id)) : [];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    packageJsonPath,
    config,
    resolveConfig,
};
export default plugin;
