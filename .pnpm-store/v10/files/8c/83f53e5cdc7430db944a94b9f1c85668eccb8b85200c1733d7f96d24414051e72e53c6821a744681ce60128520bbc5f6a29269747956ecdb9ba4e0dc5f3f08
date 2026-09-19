import { toDependency, toEntry, toProductionEntry } from '../../util/input.js';
import { get } from '../../util/object.js';
import { isInternal, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { isConfigurationOutput, isGraphqlConfigTypes, isGraphqlProjectsConfigTypes } from './types.js';
const title = 'GraphQL Codegen';
const enablers = [/^@graphql-codegen\//, 'graphql-config'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const args = {
    config: true,
};
const packageJsonPath = manifest => get(manifest, 'codegen') ?? get(manifest, 'graphql');
const config = [
    'package.json',
    'codegen.{json,yml,yaml,js,ts}',
    '.codegenrc.{json,yml,yaml,js,ts}',
    'codegen.config.js',
    '.graphqlrc',
    '.graphqlrc.{json,yml,yaml,toml,js,ts}',
    'graphql.config.{json,yml,yaml,toml,js,cjs,ts}',
];
const getPluginPackageName = (name) => {
    if (name.startsWith('@') || name.includes('codegen-'))
        return name;
    return `@graphql-codegen/${name}`;
};
const resolveConfig = (config, options) => {
    const codegenConfigs = isGraphqlProjectsConfigTypes(config)
        ? Object.values(config.projects).flatMap(project => project.extensions?.codegen ?? [])
        : isGraphqlConfigTypes(config)
            ? [config.extensions?.codegen]
            : [config];
    const generateConfigs = codegenConfigs.filter((config) => Boolean(config?.generates));
    const generateSet = generateConfigs.flatMap(config => Object.values(config.generates));
    const outputs = generateConfigs
        .flatMap(config => Object.keys(config.generates))
        .map(output => toProductionEntry(join(options.configFileDir, output.endsWith('/') ? `${output}**` : output)));
    const configurationOutput = generateSet.filter(isConfigurationOutput);
    const presets = configurationOutput
        .map(configOutput => (configOutput.preset ? configOutput.preset : undefined))
        .filter((preset) => typeof preset === 'string')
        .map(presetName => presetName.startsWith('@graphql-codegen/')
        ? presetName
        : `@graphql-codegen/${presetName}${presetName.endsWith('-preset') ? '' : '-preset'}`);
    const flatPlugins = generateSet
        .filter((config) => !isConfigurationOutput(config))
        .flatMap(item => Object.keys(item))
        .map(plugin => getPluginPackageName(plugin));
    const nestedPlugins = configurationOutput
        .flatMap(configOutput => (configOutput.plugins ? configOutput.plugins : []))
        .flatMap(plugin => {
        if (typeof plugin === 'object')
            return Object.keys(plugin);
        return [plugin];
    })
        .flatMap(plugin => {
        if (typeof plugin !== 'string')
            return [];
        if (isInternal(plugin))
            return [toEntry(plugin)];
        return [toDependency(getPluginPackageName(plugin))];
    });
    return [...presets, ...flatPlugins, ...nestedPlugins, ...outputs].map(id => typeof id === 'string' ? toDependency(id) : id);
};
const plugin = {
    title,
    args,
    enablers,
    isEnabled,
    packageJsonPath,
    config,
    resolveConfig,
};
export default plugin;
