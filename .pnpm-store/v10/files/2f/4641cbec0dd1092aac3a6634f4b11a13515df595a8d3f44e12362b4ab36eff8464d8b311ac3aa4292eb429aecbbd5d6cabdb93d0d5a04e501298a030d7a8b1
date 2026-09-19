import { hasDependency } from '../../util/plugin.js';
import { production, resolveFromAST } from './resolveFromAST.js';
const title = 'Quasar';
const enablers = ['@quasar/app', '@quasar/app-vite', '@quasar/app-webpack'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['quasar.config.{js,cjs,mjs,ts}', 'quasar.conf.js'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveFromAST,
};
export default plugin;
