import { toConfig, toIgnore, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getConfig, getDependencies } from './helpers.js';
const title = 'Expo';
const enablers = ['expo'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['app.json', 'app.config.{ts,js}'];
const production = ['app/**/*.{js,jsx,ts,tsx}', 'src/app/**/*.{js,jsx,ts,tsx}'];
const resolve = () => [toConfig('babel', 'babel.config'), toIgnore('babel-preset-expo', 'unresolved')];
const resolveConfig = async (localConfig, options) => {
    const { manifest } = options;
    const config = getConfig(localConfig, options);
    if (manifest.main === 'expo-router/entry') {
        let patterns = [...production];
        const normalizedPlugins = config.plugins?.map(plugin => (Array.isArray(plugin) ? plugin : [plugin])) ?? [];
        const expoRouterPlugin = normalizedPlugins.find(([plugin]) => plugin === 'expo-router');
        if (expoRouterPlugin) {
            const [, options] = expoRouterPlugin;
            if (typeof options?.root === 'string') {
                patterns = [join(options.root, '**/*.{js,jsx,ts,tsx}')];
            }
        }
        return patterns.map(entry => toProductionEntry(entry)).concat(await getDependencies(localConfig, options));
    }
    return production.map(entry => toProductionEntry(entry)).concat(await getDependencies(localConfig, options));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolve,
    resolveConfig,
};
export default plugin;
