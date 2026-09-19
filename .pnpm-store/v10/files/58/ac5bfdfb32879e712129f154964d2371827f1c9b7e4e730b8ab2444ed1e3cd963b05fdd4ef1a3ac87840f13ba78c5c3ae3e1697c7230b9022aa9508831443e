import { hasDependency } from '../../util/plugin.js';
const title = 'i18next Parser';
const enablers = ['i18next-parser'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['i18next-parser.config.{js,mjs,json,ts,yaml,yml}'];
const args = {
    binaries: ['i18next'],
    config: true,
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    args,
};
export default plugin;
