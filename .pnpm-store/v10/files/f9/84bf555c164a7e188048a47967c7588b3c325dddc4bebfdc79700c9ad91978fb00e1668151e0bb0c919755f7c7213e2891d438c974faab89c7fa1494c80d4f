import { parseArgs } from 'node:util';
import { Plugins } from './plugins/index.js';
import { timerify } from './util/Performance.js';
const PMap = Plugins;
const { values } = parseArgs({ strict: false, options: { performance: { type: 'boolean' } } });
const isEnabled = !!values.performance;
const timerifyMethods = ['resolve', 'resolveConfig', 'resolveFromAST'];
const PluginEntries = Object.entries(PMap);
if (isEnabled) {
    for (const [, plugin] of PluginEntries) {
        for (const method of timerifyMethods) {
            if (method in plugin)
                plugin[method] = timerify(plugin[method], `${method} (${plugin.title})`);
        }
    }
}
const pluginArgsMap = new Map(PluginEntries.flatMap(([pluginName, plugin]) => {
    if (!plugin.args)
        return [];
    const item = [pluginName, plugin.args];
    if (Array.isArray(plugin.args?.binaries))
        return plugin.args.binaries.map(bin => [bin, item]);
    return [[pluginName, item]];
}));
export { PMap as Plugins, PluginEntries, pluginArgsMap };
