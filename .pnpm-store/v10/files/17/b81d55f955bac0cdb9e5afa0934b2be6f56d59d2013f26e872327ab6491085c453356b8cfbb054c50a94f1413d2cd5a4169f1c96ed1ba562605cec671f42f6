import { toDeferResolve } from '../../util/input.js';
import { isInternal } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'mdxlint';
const enablers = ['mdxlint'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.mdxlintrc', '.mdxlintrc.{json,js,cjs,mjs,yml,yaml}', 'package.json'];
const resolveConfig = config => {
    const plugins = config.plugins
        ?.flatMap(plugin => {
        if (typeof plugin === 'string')
            return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string')
            return plugin[0];
        return [];
    })
        .map(plugin => isInternal(plugin)
        ? plugin
        : plugin.startsWith('remark-') || plugin.startsWith('mdxlint-')
            ? plugin
            : `remark-${plugin}`) ?? [];
    return plugins.map(id => toDeferResolve(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
