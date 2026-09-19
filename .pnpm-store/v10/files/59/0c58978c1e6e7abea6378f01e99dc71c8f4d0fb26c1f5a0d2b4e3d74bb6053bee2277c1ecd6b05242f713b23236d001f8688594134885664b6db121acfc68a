import { toDeferResolve, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Panda CSS';
const enablers = ['@pandacss/dev'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['panda.config.{ts,js,mjs,cjs,mts,cts}'];
const resolveConfig = config => {
    const presets = (config.presets ?? []).filter((preset) => typeof preset === 'string');
    return [...presets.map(id => toDeferResolve(id)), toDependency('postcss')];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
