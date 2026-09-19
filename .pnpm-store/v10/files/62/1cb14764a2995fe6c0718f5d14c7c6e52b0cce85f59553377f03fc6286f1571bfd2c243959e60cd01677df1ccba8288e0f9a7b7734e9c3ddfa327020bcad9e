import { hasDependency } from '../../util/plugin.js';
const title = 'Vercel';
const enablers = ['@vercel/config'];
const entry = ['vercel.{js,mjs,cjs,ts,mts}'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
};
export default plugin;
