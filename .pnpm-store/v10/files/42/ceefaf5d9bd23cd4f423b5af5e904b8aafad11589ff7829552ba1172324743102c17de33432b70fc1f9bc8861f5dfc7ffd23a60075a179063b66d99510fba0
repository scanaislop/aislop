import { hasDependency } from '../../util/plugin.js';
const title = 'Wireit';
const enablers = ['wireit'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const resolveConfig = (localConfig, options) => {
    const scripts = Object.values(localConfig).flatMap(({ command: script }) => (script ? [script] : []));
    const scriptDependencies = options.getInputsFromScripts(scripts);
    return scriptDependencies;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
