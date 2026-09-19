import { hasDependency } from '../../util/plugin.js';
const title = 'SVGO';
const enablers = ['svgo', '@svgr/plugin-svgo'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['svgo.config.{js,cjs,mjs}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
};
export default plugin;
