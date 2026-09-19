import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { defaultFilename, defaultSrcDir, resolveFromAST } from './resolveFromAST.js';
const title = 'vite-plugin-pwa';
const enablers = ['vite-plugin-pwa', '@vite-pwa/nuxt'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}', 'nuxt.config.{js,cjs,mjs,ts,cts,mts}'];
const production = [join(defaultSrcDir, defaultFilename)];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveFromAST,
};
export default plugin;
