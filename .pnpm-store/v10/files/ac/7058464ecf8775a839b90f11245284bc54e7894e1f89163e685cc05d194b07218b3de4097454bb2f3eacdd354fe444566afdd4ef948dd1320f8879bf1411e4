import { compact } from '../../util/array.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'SWC';
const enablers = ['@swc/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.swcrc'];
const resolveConfig = async (config) => {
    const inputs = config?.jsc?.experimental?.plugins ?? [];
    const externalHelpers = config.jsc?.externalHelpers ? ['@swc/helpers'] : [];
    return compact([...inputs.map(([id]) => id), ...externalHelpers]).map(id => toDependency(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
