import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'simple-git-hooks';
const enablers = ['simple-git-hooks'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.simple-git-hooks.{js,cjs,json}', 'simple-git-hooks.{js,cjs,json}', 'package.json'];
const resolveConfig = async (config, options) => {
    if (options.isProduction)
        return [];
    if (typeof config === 'function')
        config = config();
    if (!config)
        return [];
    const inputs = new Set();
    for (const hook of Object.values(config)) {
        for (const id of options.getInputsFromScripts(hook))
            inputs.add(id);
    }
    return [toDependency('simple-git-hooks'), ...Array.from(inputs)];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
