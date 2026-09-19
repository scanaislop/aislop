import { hasDependency } from '../../util/plugin.js';
const title = 'Astro DB';
const enablers = ['@astrojs/db'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['db/config.{js,ts}', 'db/seed.{js,ts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
};
export default plugin;
