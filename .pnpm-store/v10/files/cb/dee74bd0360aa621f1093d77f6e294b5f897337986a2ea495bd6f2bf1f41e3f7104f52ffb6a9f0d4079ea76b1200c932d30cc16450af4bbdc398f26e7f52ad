import { hasDependency } from '../../util/plugin.js';
const title = 'Sentry';
const enablers = [/^@sentry\//];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const production = ['sentry.{client,server,edge}.config.{js,ts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    production,
};
export default plugin;
