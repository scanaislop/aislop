import { getGitHookPaths } from '../../util/git.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'husky';
const enablers = ['husky'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isRootOnly = true;
const gitHookPaths = getGitHookPaths('.husky', false);
const config = [...gitHookPaths, 'package.json'];
const resolveConfig = (script, options) => {
    if (!script || options.isProduction)
        return [];
    if (options.configFileName === 'package.json') {
        const hooks = script.hooks;
        if (hooks) {
            const scripts = Object.values(hooks);
            return [toDependency('husky'), ...options.getInputsFromScripts(scripts, { ...options })];
        }
    }
    return options.getInputsFromScripts(String(script), { knownBinsOnly: true });
};
const plugin = {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    config,
    resolveConfig,
};
export default plugin;
