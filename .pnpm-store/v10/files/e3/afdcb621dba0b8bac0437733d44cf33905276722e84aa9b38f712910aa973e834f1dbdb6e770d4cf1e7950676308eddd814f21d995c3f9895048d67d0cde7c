import { hasDependency } from '../../util/plugin.js';
const title = '@vite-pwa/assets-generator';
const enablers = ['@vite-pwa/assets-generator'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['pwa-assets.config.{js,cjs,mjs,ts,cts,mts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
};
export default plugin;
