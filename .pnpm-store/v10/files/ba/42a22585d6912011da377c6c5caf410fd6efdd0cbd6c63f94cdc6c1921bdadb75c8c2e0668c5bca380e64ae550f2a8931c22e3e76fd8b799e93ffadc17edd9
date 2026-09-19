import { toIgnore } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'unplugin-icons';
const enablers = ['unplugin-icons'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const resolve = () => [
    toIgnore('~icons/.*', 'unresolved'),
    toIgnore('@iconify-json/.*', 'dependencies'),
    toIgnore('@iconify/json', 'dependencies'),
];
const plugin = {
    title,
    enablers,
    isEnabled,
    resolve,
};
export default plugin;
