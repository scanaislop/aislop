import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getVitePluginDirs } from '../vite/helpers.js';
const title = 'vite-plugin-vue-layouts-next';
const enablers = ['vite-plugin-vue-layouts-next', 'vite-plugin-vue-layouts', 'vite-plugin-vue-meta-layouts'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];
const defaultDir = 'src/layouts';
const production = [`${defaultDir}/**/*.vue`];
const resolveFromAST = (program, options) => {
    const dirs = getVitePluginDirs(program, enablers, 'layoutsDirs') ?? [defaultDir];
    return dirs.map(dir => toProductionEntry(join(options.configFileDir, `${dir}/**/*.vue`)));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveFromAST,
};
export default plugin;
