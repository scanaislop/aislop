import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'astro-og-canvas';
const enablers = ['astro-og-canvas'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const resolve = async () => {
    return [toDependency('canvaskit-wasm', { optional: true })];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    resolve,
};
export default plugin;
