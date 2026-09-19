import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Release It!';
const enablers = ['release-it'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.release-it.{json,js,cjs,ts,yml,yaml,toml}', 'package.json'];
const resolveConfig = (config, options) => {
    const plugins = config.plugins ? Object.keys(config.plugins) : [];
    const scripts = config.hooks ? Object.values(config.hooks).flat() : [];
    if (typeof config.github?.releaseNotes === 'string') {
        scripts.push(config.github.releaseNotes);
    }
    if (typeof config.gitlab?.releaseNotes === 'string') {
        scripts.push(config.gitlab.releaseNotes);
    }
    const inputs = options.getInputsFromScripts(scripts);
    return [...plugins.map(id => toDependency(id)), ...inputs];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
