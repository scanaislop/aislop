import { hasDependency } from '../../util/plugin.js';
const title = 'next-intl';
const enablers = ['next-intl'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const production = ['{src/,}i18n/request.{js,jsx,ts,tsx}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    production,
};
export default plugin;
