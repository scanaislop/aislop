import { hasDependency } from '../../util/plugin.js';
import { resolveFromAST } from './resolveFromAST.js';
const title = 'orval';
const enablers = ['orval'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['orval.config.{js,mjs,ts,mts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
