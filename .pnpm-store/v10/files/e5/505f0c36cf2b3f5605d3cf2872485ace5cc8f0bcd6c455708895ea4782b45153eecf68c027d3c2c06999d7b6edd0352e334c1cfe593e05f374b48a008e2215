import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'SVGR';
const enablers = ['@svgr/cli', '@svgr/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.svgrrc', '.svgrrc.{yaml,yml,json,js}', 'svgr.config.{js,cjs}', 'package.json'];
const resolveConfig = async (config) => {
    const inputs = [];
    if (config.plugins) {
        for (const plugin of config.plugins) {
            if (typeof plugin === 'string')
                inputs.push(toDependency(plugin));
        }
    }
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
