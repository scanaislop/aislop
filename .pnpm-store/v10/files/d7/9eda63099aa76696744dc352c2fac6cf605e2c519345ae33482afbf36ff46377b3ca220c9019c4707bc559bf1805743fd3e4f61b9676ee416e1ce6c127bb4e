import { hasDependency } from '../../util/plugin.js';
const title = 'Plop';
const enablers = ['plop'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['plopfile.{cjs,mjs,js,ts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
};
export default plugin;
