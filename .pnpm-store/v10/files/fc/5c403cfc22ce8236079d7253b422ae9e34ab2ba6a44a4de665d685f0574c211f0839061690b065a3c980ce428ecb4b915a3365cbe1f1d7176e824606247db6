import { hasDependency } from '../../util/plugin.js';
const title = 'Oxfmt';
const enablers = ['oxfmt'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.oxfmtrc.json', '.oxfmtrc.jsonc', 'oxfmt.config.{ts,mts}'];
const args = {
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
