import { hasDependency } from '../../util/plugin.js';
import { toC12config } from '../../util/plugin-config.js';
const title = 'Changelogithub';
const enablers = ['changelogithub'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['package.json', ...toC12config('changelogithub')];
const isRootOnly = true;
const plugin = {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    entry,
};
export default plugin;
