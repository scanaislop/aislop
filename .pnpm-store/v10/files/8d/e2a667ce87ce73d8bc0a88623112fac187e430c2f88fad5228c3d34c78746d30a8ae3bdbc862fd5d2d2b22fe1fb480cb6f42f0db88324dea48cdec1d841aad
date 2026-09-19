import { hasDependency } from '../../util/plugin.js';
const title = '@nuxtjs/i18n';
const enablers = ['@nuxtjs/i18n'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['i18n.config.{js,mjs,ts}', 'i18n/i18n.config.{js,mjs,ts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
};
export default plugin;
