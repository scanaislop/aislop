import { hasDependency } from '../../util/plugin.js';
const title = 'Temporal.io';
const enablers = ['@temporalio/worker'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const production = ['src/workflows{,/index}.{js,cjs,mjs,ts,cts,mts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    production,
};
export default plugin;
