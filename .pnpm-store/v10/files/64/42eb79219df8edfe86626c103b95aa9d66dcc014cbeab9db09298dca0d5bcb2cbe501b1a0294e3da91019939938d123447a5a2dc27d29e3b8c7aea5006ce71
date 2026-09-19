import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
const title = 'commitlint';
const enablers = ['@commitlint/cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = [
    'package.json',
    'package.yaml',
    ...toCosmiconfig('commitlint', { additionalExtensions: ['cts', 'mts'] }),
];
const resolveConfig = async (config) => {
    const extendsConfigs = config.extends
        ? [config.extends]
            .flat()
            .map(id => (id.startsWith('@') || id.startsWith('commitlint-config-') ? id : `commitlint-config-${id}`))
        : [];
    const plugins = config.plugins ? [config.plugins].flat().filter(s => typeof s === 'string') : [];
    const formatter = config.formatter ? [config.formatter] : [];
    const parserPreset = await config.parserPreset;
    const parserPresetPaths = parserPreset
        ? typeof parserPreset === 'string'
            ? [parserPreset]
            : parserPreset.path
                ? [parserPreset.path ?? parserPreset]
                : []
        : [];
    return [...extendsConfigs, ...plugins, ...formatter, ...parserPresetPaths].map(id => toDependency(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
