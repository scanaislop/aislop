import { hasDependency } from '../../util/plugin.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
import { createRequireContextVisitor } from '../webpack/visitors/requireContext.js';
const title = 'Rspack';
const enablers = ['@rspack/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['rspack.config*.{js,ts,mjs,mts,cjs,cts}'];
const resolveConfig = async (localConfig, options) => {
    const inputs = await findWebpackDependenciesFromConfig(localConfig, options);
    return inputs.filter(input => !input.specifier.startsWith('builtin:'));
};
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createRequireContextVisitor(ctx));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    registerVisitors,
};
export default plugin;
