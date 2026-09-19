import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'yorkie';
const enablers = ['yorkie'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const packageJsonPath = 'gitHooks';
const config = ['package.json'];
const resolveConfig = (config, options) => {
    const inputs = new Set();
    for (const script of Object.values(config).flat()) {
        const scripts = [script].flat();
        for (const identifier of options.getInputsFromScripts(scripts))
            inputs.add(identifier);
    }
    return [toDependency('yorkie'), ...inputs];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    packageJsonPath,
    config,
    resolveConfig,
};
export default plugin;
