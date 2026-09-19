import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { toLilconfig } from '../../util/plugin-config.js';
const title = 'size-limit';
const enablers = ['size-limit'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = [...toLilconfig('size-limit', { configDir: false, additionalExtensions: ['mts', 'cts'], rcSuffix: '' })];
const resolve = options => {
    const allDeps = [
        ...Object.keys(options.manifest.dependencies || {}),
        ...Object.keys(options.manifest.devDependencies || {}),
    ];
    const sizeLimitDeps = allDeps.filter(dep => dep.startsWith('@size-limit/'));
    return sizeLimitDeps.map(dep => toDependency(dep));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    resolve,
};
export default plugin;
