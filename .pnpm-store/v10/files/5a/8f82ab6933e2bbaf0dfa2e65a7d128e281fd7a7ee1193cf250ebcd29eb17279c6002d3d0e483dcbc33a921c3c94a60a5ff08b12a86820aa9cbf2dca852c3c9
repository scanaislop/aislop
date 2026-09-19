import { hasDependency } from '../../util/plugin.js';
const title = 'Sanity';
const enablers = ['sanity'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['sanity.config.{js,jsx,ts,tsx}', 'sanity.cli.{ts,js}', 'sanity.blueprint.{ts,js,json}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
};
export default plugin;
