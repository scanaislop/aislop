import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Preconstruct';
const enablers = ['@preconstruct/cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const resolveConfig = async (config) => {
    return (config.entrypoints ?? []).map(id => toProductionEntry(join('src', id), { allowIncludeExports: true }));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
