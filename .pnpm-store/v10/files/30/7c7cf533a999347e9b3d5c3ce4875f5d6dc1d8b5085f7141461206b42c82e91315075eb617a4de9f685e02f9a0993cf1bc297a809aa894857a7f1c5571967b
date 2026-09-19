import { hasDependency } from '../../util/plugin.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
const title = 'Syncpack';
const enablers = ['syncpack'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', ...toCosmiconfig('syncpack')];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
};
export default plugin;
