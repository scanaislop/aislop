import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = '__PLUGIN_NAME__';
const enablers = ['__PLUGIN_NAME__'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = [];
const entry = [];
const production = [];
const resolveConfig = async (config) => {
    const inputs = config?.plugins ?? [];
    return Array.from(inputs, id => toDeferResolve(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    production,
    resolveConfig,
};
export default plugin;
