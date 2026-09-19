import { toDependency, toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'oclif';
const enablers = ['oclif', '@oclif/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const production = ['{,src/}commands/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'];
const resolveConfig = async (config) => {
    if (!config)
        return [];
    const inputs = production.map(id => toProductionEntry(id));
    for (const id of [...(config.plugins ?? []), ...(config.devPlugins ?? [])])
        inputs.push(toDependency(id));
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveConfig,
};
export default plugin;
