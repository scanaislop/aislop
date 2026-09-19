import { DEFAULT_EXTENSIONS } from '../../constants.js';
import { isDirectory } from '../../util/fs.js';
import { toDeferResolve, toProductionEntry } from '../../util/input.js';
import { isInNodeModules, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { DummyEleventyConfig, defaultEleventyConfig } from './helpers.js';
const title = 'Eleventy';
const enablers = ['@11ty/eleventy'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.eleventy.js', 'eleventy.config.{js,cjs,mjs}'];
const production = ['posts/**/*.11tydata.js', '_data/**/*.{js,cjs,mjs}'];
const resolveConfig = async (localConfig, options) => {
    const { configFileDir } = options;
    const dummyUserConfig = new DummyEleventyConfig();
    if (typeof localConfig === 'function')
        localConfig = (await localConfig(dummyUserConfig));
    const inputDir = localConfig?.dir?.input || defaultEleventyConfig.dir.input;
    const dataDir = localConfig?.dir?.data || defaultEleventyConfig.dir.data;
    const templateFormats = localConfig?.templateFormats || defaultEleventyConfig.templateFormats;
    const exts = Array.from(DEFAULT_EXTENSIONS, extname => extname.slice(1)).join(',');
    const copiedEntries = new Set();
    const copiedPackages = new Set();
    for (const path of Object.keys(dummyUserConfig.passthroughCopies)) {
        const isDir = !path.includes('*') && isDirectory(configFileDir, path);
        if (isDir) {
            copiedEntries.add(join(path, `**/*.{${exts}}`));
        }
        else if (!isInNodeModules(path)) {
            copiedEntries.add(path);
        }
    }
    for (const path of Object.keys(dummyUserConfig.passthroughCopies)) {
        if (isInNodeModules(path))
            copiedPackages.add(path);
    }
    return Array.from(copiedPackages)
        .map(id => toDeferResolve(id))
        .concat([
        join(inputDir, dataDir, '**/*.{js,cjs,mjs}'),
        join(inputDir, `**/*.{${typeof templateFormats === 'string' ? templateFormats : templateFormats.join(',')}}`),
        join(inputDir, '**/*.11tydata.js'),
        ...copiedEntries,
    ].map(id => toProductionEntry(id)));
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
