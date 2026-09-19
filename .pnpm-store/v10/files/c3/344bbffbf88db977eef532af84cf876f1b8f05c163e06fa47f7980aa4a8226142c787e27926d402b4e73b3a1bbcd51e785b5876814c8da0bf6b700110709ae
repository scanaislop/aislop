import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Wrangler';
const enablers = ['wrangler'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['wrangler.{json,jsonc,toml}'];
const resolveConfig = async (config) => {
    return (config.main ? [config.main] : []).map(id => toProductionEntry(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
