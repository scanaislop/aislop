import { hasDependency } from '../../util/plugin.js';
import { resolveLoadPluginStylePluginName } from './helpers.js';
const title = 'Remark';
const enablers = ['remark-cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const packageJsonPath = 'remarkConfig';
const config = ['package.json', '.remarkrc', '.remarkrc.json', '.remarkrc.{js,cjs,mjs}', '.remarkrc.{yml,yaml}'];
const resolveConfig = (config, options) => {
    const plugins = config.plugins
        ?.flatMap(plugin => {
        if (typeof plugin === 'string')
            return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string')
            return plugin[0];
        return [];
    })
        .map(plugin => resolveLoadPluginStylePluginName('remark-', plugin, options.manifest)) ?? [];
    return plugins;
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
