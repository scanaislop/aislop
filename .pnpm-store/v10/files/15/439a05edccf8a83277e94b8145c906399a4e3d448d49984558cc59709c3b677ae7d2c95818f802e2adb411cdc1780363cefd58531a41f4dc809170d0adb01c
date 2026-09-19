import { hasDependency } from '../../util/plugin.js';
import { toC12config } from '../../util/plugin-config.js';
const title = 'Changelogen';
const enablers = ['changelogen'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['package.json', ...toC12config('changelog')];
const isRootOnly = true;
const plugin = {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    entry,
};
export default plugin;
