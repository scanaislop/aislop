import { toAlias, toConfig, toDependency, toIgnore, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { CORE_CLIENT_API, resolveConfigItems } from './helpers.js';
const title = 'Docusaurus';
const enablers = ['@docusaurus/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['docusaurus.config.{js,cjs,mjs,ts,cts,mts}'];
const production = ['src/pages/**/*.{js,ts,jsx,tsx}', '{blog,docs}/**/*.mdx', 'versioned_docs/**/*.{mdx,jsx,tsx}'];
const resolve = () => [toConfig('babel', 'babel.config')];
const resolveStaticAssets = (items, cwd) => {
    const entries = [];
    for (const item of items ?? []) {
        const value = typeof item === 'string' ? item : (item.src ?? item.href);
        if (typeof value === 'string' && !value.includes('://'))
            entries.push(toProductionEntry(join(cwd, 'static', value)));
    }
    return entries;
};
const resolveConfig = async (config, options) => {
    const themes = await resolveConfigItems(config.themes ?? [], 'theme', options);
    const plugins = await resolveConfigItems(config.plugins ?? [], 'plugin', options);
    const presets = await resolveConfigItems(config.presets ?? [], 'preset', options);
    const hasClassicTheme = options.manifest.dependencies?.['@docusaurus/theme-classic'] ||
        options.manifest.dependencies?.['@docusaurus/preset-classic'];
    const scripts = resolveStaticAssets(config.scripts ?? [], options.cwd);
    const stylesheets = resolveStaticAssets(config.stylesheets ?? [], options.cwd);
    return [
        toAlias('@site/*', './*'),
        toDependency('@docusaurus/module-type-aliases', { optional: true }),
        ...(hasClassicTheme ? [toIgnore('(@theme|@theme-init|@theme-original)/*', 'dependencies')] : []),
        toIgnore(`@docusaurus/(${CORE_CLIENT_API.join('|')})`, 'dependencies'),
        toIgnore('@generated/.*', 'dependencies'),
        ...(config.future?.experimental_faster ? [toDependency('@docusaurus/faster')] : []),
        ...production.map(id => toProductionEntry(id)),
        ...themes,
        ...plugins,
        ...presets,
        ...scripts,
        ...stylesheets,
    ];
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
