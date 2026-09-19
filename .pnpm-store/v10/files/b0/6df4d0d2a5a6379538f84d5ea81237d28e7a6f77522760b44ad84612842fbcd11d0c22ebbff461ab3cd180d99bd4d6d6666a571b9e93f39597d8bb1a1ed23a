import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
const title = 'LintHTML';
const packageJsonPath = 'linthtmlConfig';
const enablers = ['@linthtml/linthtml'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', ...toCosmiconfig('linthtml')];
const resolveConfig = config => {
    const extensions = config.extends ?? [];
    const plugins = config.plugins ?? [];
    return [extensions, plugins].flat().map(id => toDeferResolve(id));
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
