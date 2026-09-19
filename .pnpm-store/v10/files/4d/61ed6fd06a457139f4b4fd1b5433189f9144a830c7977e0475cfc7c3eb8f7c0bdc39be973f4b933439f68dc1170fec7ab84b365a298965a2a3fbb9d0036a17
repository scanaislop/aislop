import { toEntry } from '../../util/input.js';
import { isAbsolute, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { configFiles, inputsFromFrameworks, inputsFromPlugins, loadConfig } from './helpers.js';
const title = 'Karma';
const enablers = ['karma'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = configFiles;
const resolveConfig = async (localConfig, options) => {
    const inputs = new Set();
    const config = loadConfig(localConfig);
    if (!config)
        return [];
    if (config.frameworks) {
        inputsFromFrameworks(config.frameworks).forEach(inputs.add, inputs);
    }
    inputsFromPlugins(config.plugins, options.manifest.devDependencies).forEach(inputs.add, inputs);
    const basePath = config.basePath ?? '';
    if (config.files) {
        for (const fileOrPatternObj of config.files) {
            const fileOrPattern = typeof fileOrPatternObj === 'string' ? fileOrPatternObj : fileOrPatternObj.pattern;
            const absPath = isAbsolute(fileOrPattern) ? fileOrPattern : join(options.configFileDir, basePath, fileOrPattern);
            inputs.add(toEntry(absPath));
        }
    }
    if (config.exclude) {
        for (const fileOrPattern of config.exclude) {
            const absPath = isAbsolute(fileOrPattern) ? fileOrPattern : join(options.configFileDir, basePath, fileOrPattern);
            inputs.add(toEntry(`!${absPath}`));
        }
    }
    return Array.from(inputs);
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
