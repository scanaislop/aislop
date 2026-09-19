import { compact } from '../../util/array.js';
import { toConfig, toDeferResolve, toDependency } from '../../util/input.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from '../../util/modules.js';
import { extname, isAbsolute, isInternal } from '../../util/path.js';
import { substringBefore } from '../../util/string.js';
import { getDependenciesFromConfig } from '../babel/index.js';
export const isFlatConfig = (fileName) => /eslint\.config/.test(fileName);
export const getInputs = (config, options) => {
    const { configFileName } = options;
    if (extname(configFileName) === '.json' || !isFlatConfig(configFileName)) {
        return getInputsDeprecated(config, options);
    }
    const configArray = Array.isArray(config) ? config : [config];
    const dependencies = configArray.flatMap(config => config.settings ? getDependenciesFromSettings(config.settings) : []);
    dependencies.push('eslint-import-resolver-typescript');
    return compact(dependencies).map(id => toDeferResolve(id, { optional: true }));
};
const getInputsDeprecated = (config, options) => {
    const extendsSpecifiers = config.extends ? compact([config.extends].flat().map(resolveExtendSpecifier)) : [];
    if (extendsSpecifiers.some(specifier => specifier?.startsWith('eslint-plugin-prettier')))
        extendsSpecifiers.push('eslint-config-prettier');
    const extendConfigs = extendsSpecifiers.map(specifier => toConfig('eslint', specifier, { containingFilePath: options.configFilePath }));
    const plugins = config.plugins ? config.plugins.map(resolvePluginSpecifier) : [];
    const parser = config.parser ?? config.parserOptions?.parser;
    const babelDependencies = config.parserOptions?.babelOptions
        ? getDependenciesFromConfig(config.parserOptions.babelOptions)
        : [];
    const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
    const rules = getDependenciesFromRules({});
    const overrides = config.overrides ? [config.overrides].flat().flatMap(d => getInputsDeprecated(d, options)) : [];
    const deferred = compact([...extendsSpecifiers, ...plugins, parser, ...settings, ...rules]).map(id => toDeferResolve(id));
    return [...extendConfigs, ...deferred, ...babelDependencies, ...overrides];
};
const isQualifiedSpecifier = (specifier) => specifier === 'eslint' ||
    /\/eslint-(config|plugin)$/.test(specifier) ||
    /.+eslint-(config|plugin)\//.test(specifier) ||
    /eslint-(config|plugin)-/.test(specifier);
const resolveSpecifier = (namespace, rawSpecifier) => {
    const specifier = rawSpecifier.replace(/(^plugin:|:.+$)/, '');
    if (isQualifiedSpecifier(specifier))
        return specifier;
    if (!specifier.startsWith('@')) {
        const id = rawSpecifier.startsWith('plugin:')
            ? getPackageNameFromModuleSpecifier(specifier)
            : substringBefore(specifier, '/');
        return `${namespace}-${id}`;
    }
    const [scope, name, ...rest] = specifier.split('/');
    if (rawSpecifier.startsWith('plugin:') && rest.length === 0)
        return [scope, namespace].join('/');
    return [scope, name ? `${namespace}-${name}` : namespace, ...rest].join('/');
};
const resolvePluginSpecifier = (specifier) => resolveSpecifier('eslint-plugin', specifier);
const resolveExtendSpecifier = (specifier) => {
    if (isInternal(specifier))
        return;
    const namespace = specifier.startsWith('plugin:') ? 'eslint-plugin' : 'eslint-config';
    return resolveSpecifier(namespace, specifier);
};
const getDependenciesFromRules = (rules = {}) => Object.keys(rules).flatMap(ruleKey => ruleKey.includes('/') ? [resolveSpecifier('eslint-plugin', ruleKey.split('/').slice(0, -1).join('/'))] : []);
const getDependenciesFromSettings = (settings = {}) => {
    return Object.entries(settings).flatMap(([settingKey, settings]) => {
        if (settingKey === 'import/resolver') {
            return (typeof settings === 'string' ? [settings] : Object.keys(settings))
                .filter(key => key !== 'node')
                .map(key => {
                if (isInternal(key))
                    return key;
                if (isAbsolute(key))
                    return getPackageNameFromFilePath(key);
                return `eslint-import-resolver-${key}`;
            });
        }
        if (settingKey === 'import/parsers') {
            return (typeof settings === 'string' ? [settings] : Object.keys(settings)).map(key => {
                if (isAbsolute(key))
                    return getPackageNameFromFilePath(key);
                return key;
            });
        }
    });
};
export const getInputsFromSettings = (settings) => compact(getDependenciesFromSettings(settings)).map(id => toDeferResolve(id, { optional: true }));
const builtinFormatters = new Set(['html', 'json-with-metadata', 'json', 'stylish']);
export const resolveFormatters = (formatters) => {
    const inputs = new Set();
    for (const formatter of [formatters].flat()) {
        if (builtinFormatters.has(formatter))
            continue;
        else if (isInternal(formatter))
            inputs.add(toDeferResolve(formatter));
        else
            inputs.add(toDependency(`eslint-formatter-${formatter}`));
    }
    return inputs;
};
