import { toIgnore, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getVitePluginDirs } from '../vite/helpers.js';
const title = 'vite-plugin-pages';
const enablers = ['vite-plugin-pages'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];
const extensions = 'vue,jsx,tsx,md,mdx';
const defaultDir = 'src/pages';
const production = [`${defaultDir}/**/*.{${extensions}}`];
const resolveFromAST = (program, options) => {
    const dirs = getVitePluginDirs(program, enablers, 'dirs') ?? [defaultDir];
    return dirs.map(dir => toProductionEntry(join(options.configFileDir, `${dir}/**/*.{${extensions}}`)));
};
const resolve = () => ['~pages', '~react-pages', '~solid-pages'].map(specifier => toIgnore(specifier, 'unresolved'));
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveFromAST,
    resolve,
};
export default plugin;
