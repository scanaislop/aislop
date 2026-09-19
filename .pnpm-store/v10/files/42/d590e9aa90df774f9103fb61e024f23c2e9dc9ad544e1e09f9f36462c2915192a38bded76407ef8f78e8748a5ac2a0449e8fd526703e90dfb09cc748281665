import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Parcel';
const enablers = ['parcel', '@parcel/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.parcelrc'];
const resolveConfig = async (config) => {
    const dependencies = [];
    if (typeof config.extends === 'string') {
        dependencies.push(config.extends);
    }
    else if (Array.isArray(config.extends)) {
        dependencies.push(...config.extends);
    }
    const extractPlugins = (plugins) => {
        if (!plugins)
            return [];
        return typeof plugins === 'string' ? [plugins] : plugins;
    };
    const extractPluginsFromMap = (pluginMap) => {
        if (!pluginMap)
            return [];
        return Object.values(pluginMap).flatMap(extractPlugins);
    };
    if (config.resolvers)
        dependencies.push(...extractPlugins(config.resolvers));
    if (config.transformers)
        dependencies.push(...extractPluginsFromMap(config.transformers));
    if (config.bundler)
        dependencies.push(config.bundler);
    if (config.namers)
        dependencies.push(...extractPlugins(config.namers));
    if (config.runtimes)
        dependencies.push(...extractPluginsFromMap(config.runtimes));
    if (config.packagers)
        dependencies.push(...extractPluginsFromMap(config.packagers));
    if (config.optimizers)
        dependencies.push(...extractPluginsFromMap(config.optimizers));
    if (config.compressors)
        dependencies.push(...extractPluginsFromMap(config.compressors));
    if (config.reporters)
        dependencies.push(...extractPlugins(config.reporters));
    if (config.validators)
        dependencies.push(...extractPluginsFromMap(config.validators));
    return dependencies.map(id => toDeferResolve(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
