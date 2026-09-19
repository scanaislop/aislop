import { hasDependency } from '../../util/plugin.js';
import { resolveFromAST } from './resolveFromAST.js';
const title = 'vite-plus';
const enablers = ['vite-plus'];
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
