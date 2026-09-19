import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'nyc';
const enablers = ['nyc'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.nycrc', '.nycrc.{json,yml,yaml}', 'nyc.config.js', 'package.json'];
const resolveConfig = config => {
    const extend = config?.extends ?? [];
    const requires = config?.require ?? [];
    return [extend, requires].flat().map(id => toDeferResolve(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
