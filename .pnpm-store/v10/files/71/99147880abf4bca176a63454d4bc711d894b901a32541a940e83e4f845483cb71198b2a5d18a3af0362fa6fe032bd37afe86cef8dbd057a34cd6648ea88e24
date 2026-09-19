import { toEntry, toProject } from '../../util/input.js';
import { relative } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getActionDependencies } from '../github-actions/index.js';
const title = 'GitHub Action';
const enablers = ['@actions/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['action.{yml,yaml}'];
const isAssumeArtifact = (specifier) => /^(dist|build)\//.test(specifier);
const resolveConfig = async (config, options) => {
    const inputs = [];
    const filePaths = getActionDependencies(config, options);
    for (const filePath of new Set(filePaths)) {
        const relativePath = relative(options.cwd, filePath);
        if (isAssumeArtifact(relativePath))
            inputs.push(toProject(`!${relativePath}`));
        else
            inputs.push(toEntry(relativePath));
    }
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
