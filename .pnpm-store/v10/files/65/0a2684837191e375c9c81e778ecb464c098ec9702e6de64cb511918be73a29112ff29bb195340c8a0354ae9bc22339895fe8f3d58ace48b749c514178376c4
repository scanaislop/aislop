import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'MDX';
const enablers = ['astro', 'mdxlint'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['tsconfig.json'];
const takeDependencies = (config) => {
    const inputs = [];
    if (Array.isArray(config.plugins)) {
        for (const plugin of config.plugins) {
            if (typeof plugin === 'string')
                inputs.push(toDependency(plugin));
            else if (typeof plugin[0] === 'string')
                inputs.push(toDependency(plugin[0]));
        }
    }
    return inputs;
};
const resolveConfig = async (config, options) => {
    const { configFileName } = options;
    if (configFileName === 'tsconfig.json' && 'mdx' in config)
        return takeDependencies(config.mdx);
    return [];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
