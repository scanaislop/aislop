import { hasDependency } from '../../util/plugin.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
const title = 'lockfile-lint';
const enablers = ['lockfile-lint'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', ...toCosmiconfig('lockfile-lint', { additionalExtensions: ['toml'] })];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
};
export default plugin;
