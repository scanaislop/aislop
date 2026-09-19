import { hasDependency } from '../../util/plugin.js';
import { resolveFromAST } from './resolveFromAST.js';
const title = 'laravel-vite-plugin';
const enablers = ['laravel-vite-plugin'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
