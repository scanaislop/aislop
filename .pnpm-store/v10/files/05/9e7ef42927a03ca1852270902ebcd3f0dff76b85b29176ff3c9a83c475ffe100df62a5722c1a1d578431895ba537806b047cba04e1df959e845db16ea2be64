import { hasDependency } from '../../util/plugin.js';
import { resolveFromAST } from './resolveFromAST.js';
const title = 'SST';
const enablers = ['sst'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['sst.config.ts'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
