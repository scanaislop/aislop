import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'pre-commit';
const packages = ['pre-commit', '@fastify/pre-commit'];
const enablers = packages;
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isRootOnly = true;
const resolve = options => {
    const { dependencies, devDependencies } = options.manifest;
    const inputs = [];
    for (const name of packages)
        if (dependencies?.[name] || devDependencies?.[name])
            inputs.push(toDependency(name));
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    resolve,
};
export default plugin;
