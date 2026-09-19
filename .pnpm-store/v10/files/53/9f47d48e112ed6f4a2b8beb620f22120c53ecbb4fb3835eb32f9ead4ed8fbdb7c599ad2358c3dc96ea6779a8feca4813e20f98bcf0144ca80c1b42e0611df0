import { hasDependency } from '../../util/plugin.js';
const title = 'VitePress';
const enablers = ['vitepress'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = [
    '.vitepress/config.{js,ts,mjs,mts,cjs,cts}',
    '.vitepress/config/index.{js,ts,mjs,mts,cjs,cts}',
    '.vitepress/theme/index.{js,ts,mjs,mts}',
];
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
};
export default plugin;
