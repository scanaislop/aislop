import { toAlias, toDeferResolve, toDeferResolveEntry, toDeferResolveProductionEntry, toDependency, } from '../../util/input.js';
import { extname, isInternal, join, toAbsolute } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import { createRequireContextVisitor } from './visitors/requireContext.js';
const title = 'webpack';
const enablers = ['webpack', 'webpack-cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['webpack.config.{js,ts,mjs,cjs,mts,cts}'];
const interpretLoaders = {
    '.ts': ['ts-node', 'sucrase', '@babel/register', 'esbuild-register', '@swc/register'],
    '.cts': ['ts-node'],
};
const hasBabelOptions = (use) => Boolean(use) &&
    typeof use !== 'string' &&
    'loader' in use &&
    typeof use.loader === 'string' &&
    use.loader === 'babel-loader' &&
    typeof use.options === 'object';
const hasLoaderOptions = (use) => Boolean(use) &&
    typeof use !== 'string' &&
    'loader' in use &&
    typeof use.loader === 'string' &&
    typeof use.options === 'object';
const info = {
    compiler: '',
    issuer: '',
    realResource: '',
    resource: '',
    resourceQuery: '',
    dependency: '',
    descriptionData: {},
    issuerLayer: '',
};
const resolveRuleSetDependencies = (rule) => {
    if (!rule || typeof rule === 'string')
        return [];
    if (typeof rule.use === 'string')
        return [rule.use];
    let useItem = rule.use ?? rule.loader ?? rule;
    if (typeof useItem === 'function')
        useItem = useItem(info);
    if (typeof useItem === 'string' && hasBabelOptions(rule)) {
        const d = getDependenciesFromConfig(rule.options).map(d => d.specifier);
        return [useItem, ...d];
    }
    return [useItem].flat().flatMap((item) => {
        if (!item)
            return [];
        if (hasBabelOptions(item)) {
            const d = getDependenciesFromConfig(item.options).map(d => d.specifier);
            return [...resolveUseItem(item), ...d];
        }
        if (typeof item !== 'string' && 'oneOf' in item)
            return item.oneOf?.flatMap(resolveRuleSetDependencies) ?? [];
        return resolveUseItem(item);
    });
};
const isSwcLoader = (loader) => loader === 'builtin:swc-loader' || loader.endsWith('/swc-loader') || loader === 'swc-loader';
const resolveSwcPluginDependencies = (use) => {
    if (!hasLoaderOptions(use) || !isSwcLoader(use.loader))
        return [];
    const plugins = use.options.jsc?.experimental?.plugins;
    if (!Array.isArray(plugins))
        return [];
    return plugins.flatMap(plugin => {
        if (typeof plugin === 'string')
            return [plugin];
        if (Array.isArray(plugin) && typeof plugin[0] === 'string')
            return [plugin[0]];
        return [];
    });
};
const resolveUseItem = (use) => {
    if (!use)
        return [];
    if (typeof use === 'string')
        return [use];
    if ('loader' in use && typeof use.loader === 'string')
        return [use.loader, ...resolveSwcPluginDependencies(use)];
    return [];
};
export const findWebpackDependenciesFromConfig = async (config, options) => {
    const { cwd, isProduction } = options;
    const passes = typeof config === 'function' ? [false, true] : [isProduction];
    const inputs = new Set();
    for (const isProduction of passes) {
        const mode = isProduction ? 'production' : 'development';
        const env = { production: isProduction, mode };
        const argv = { mode };
        const resolvedConfig = typeof config === 'function' ? await config(env, argv) : config;
        for (const opts of [resolvedConfig].flat()) {
            const entries = [];
            for (const loader of opts.module?.rules?.flatMap(resolveRuleSetDependencies) ?? []) {
                inputs.add(toDeferResolve(loader.replace(/\?.*/, '')));
            }
            for (const plugin of opts?.plugins ?? []) {
                if (plugin && plugin.constructor.name === 'ProvidePlugin') {
                    const providePluginInstance = plugin;
                    if (providePluginInstance.definitions) {
                        for (const values of Object.values(providePluginInstance.definitions)) {
                            const specifier = typeof values === 'string' ? values : values[0];
                            inputs.add(toDeferResolve(specifier));
                        }
                    }
                }
            }
            const entry = typeof opts.entry === 'function' ? await opts.entry() : opts.entry;
            if (typeof entry === 'string')
                entries.push(entry);
            else if (Array.isArray(entry))
                entries.push(...entry);
            else if (typeof entry === 'object') {
                for (const item of Object.values(entry)) {
                    if (typeof item === 'string')
                        entries.push(item);
                    else if (Array.isArray(item))
                        entries.push(...item);
                    else if (typeof item === 'function')
                        entries.push(item());
                    else if (item && typeof item === 'object' && 'import' in item)
                        entries.push(...[item.import].flat());
                }
            }
            if (entries.length === 0 && opts.context)
                entries.push('./src/index');
            for (const entry of entries) {
                if (isInternal(entry) || entry.startsWith('#')) {
                    const dir = opts.context ? opts.context : cwd;
                    const input = isProduction
                        ? toDeferResolveProductionEntry(entry, { dir })
                        : toDeferResolveEntry(entry, { dir });
                    inputs.add(input);
                }
                else {
                    inputs.add(toDeferResolve(entry));
                }
            }
            const processAlias = (aliases) => {
                const addStar = (value) => (value.endsWith('*') ? value : join(value, '*').replace(/\/\*\*$/, '/*'));
                for (const [alias, value] of Object.entries(aliases)) {
                    if (!value)
                        continue;
                    const prefixes = Array.isArray(value) ? value : [value];
                    if (alias.endsWith('$')) {
                        inputs.add(toAlias(alias.slice(0, -1), prefixes));
                    }
                    else {
                        if (alias.length > 1)
                            inputs.add(toAlias(alias, prefixes));
                        for (const prefix of prefixes) {
                            inputs.add(toAlias(addStar(alias), [addStar(toAbsolute(prefix, options.configFileDir))]));
                        }
                    }
                }
            };
            if (opts.resolve?.alias) {
                processAlias(opts.resolve.alias);
            }
            if (opts.resolveLoader?.alias) {
                processAlias(opts.resolveLoader.alias);
            }
        }
    }
    return Array.from(inputs);
};
const resolveConfig = async (localConfig, options) => {
    const inputs = await findWebpackDependenciesFromConfig(localConfig, options);
    inputs.push(toDependency('webpack-cli', { optional: true }));
    for (const loader of interpretLoaders[extname(options.configFilePath)] ?? []) {
        inputs.push(toDependency(loader, { optional: true }));
    }
    return inputs;
};
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createRequireContextVisitor(ctx));
};
const isFilterTransitiveDependencies = true;
const args = {
    binaries: ['webpack', 'webpack-dev-server'],
    config: true,
    resolveInputs: (parsed) => {
        const inputs = [toDependency('webpack-cli')];
        if (parsed._[0] === 'serve')
            inputs.push(toDependency('webpack-dev-server'));
        return inputs;
    },
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    registerVisitors,
    isFilterTransitiveDependencies,
    args,
};
export default plugin;
