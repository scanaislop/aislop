import { hasDependency } from '../../util/plugin.js';
import { createExecaVisitor } from './visitors/execa.js';
const title = 'execa';
const enablers = ['execa'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createExecaVisitor(ctx));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerVisitors,
};
export default plugin;
