import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Commitizen';
const enablers = ['commitizen'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isRootOnly = true;
const packageJsonPath = 'config.commitizen';
const config = ['.czrc', '.cz.json', 'package.json'];
const resolveConfig = config => {
    return config.path ? [toDependency(config.path)] : [];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    packageJsonPath,
    config,
    resolveConfig,
};
export default plugin;
