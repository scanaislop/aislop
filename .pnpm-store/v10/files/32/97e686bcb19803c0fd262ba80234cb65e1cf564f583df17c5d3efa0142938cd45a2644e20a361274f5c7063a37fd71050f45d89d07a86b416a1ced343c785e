import { hasDependency } from '../../util/plugin.js';
import { config } from '../astro/index.js';
import { resolveFromAST } from './resolveFromAST.js';
const title = 'Starlight';
const enablers = ['@astrojs/starlight'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
