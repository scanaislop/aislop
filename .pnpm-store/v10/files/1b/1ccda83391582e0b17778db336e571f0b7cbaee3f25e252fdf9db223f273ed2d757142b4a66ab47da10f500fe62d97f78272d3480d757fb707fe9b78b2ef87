import { compact } from '../../util/array.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { api, resolveName } from './helpers.js';
const title = 'Babel';
const enablers = [/^@babel\//];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['babel.config.{json,js,cjs,mjs,cts,ts}', '.babelrc.{json,js,cjs,mjs,cts}', '.babelrc', 'package.json'];
const getName = (value) => [Array.isArray(value) ? value[0] : value].filter(name => typeof name === 'string');
export const getDependenciesFromConfig = (config) => {
    const presets = config.presets?.flatMap(getName).map(name => resolveName(name, 'preset')) ?? [];
    const plugins = config.plugins?.flatMap(getName).map(name => resolveName(name, 'plugin')) ?? [];
    const nested = config.env ? Object.values(config.env).flatMap(getDependenciesFromConfig) : [];
    const overrides = config.overrides ? [config.overrides].flat().flatMap(getDependenciesFromConfig) : [];
    return compact([
        ...presets.map(id => toDeferResolve(id)),
        ...plugins.map(id => toDeferResolve(id)),
        ...(plugins.includes('@babel/plugin-transform-runtime')
            ? [toDeferResolve('@babel/runtime', { optional: true })]
            : []),
        ...nested,
        ...overrides,
    ]);
};
const resolveConfig = async (config) => {
    if (typeof config === 'function')
        config = config(api);
    if (!config)
        return [];
    return getDependenciesFromConfig(config);
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
