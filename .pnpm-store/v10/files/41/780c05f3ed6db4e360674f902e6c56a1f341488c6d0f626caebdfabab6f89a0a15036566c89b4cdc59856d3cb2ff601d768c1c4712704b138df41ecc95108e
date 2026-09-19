import { hasDependency } from '../../util/plugin.js';
import { createZxVisitor } from './visitors/zx.js';
const title = 'zx';
const enablers = ['zx'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createZxVisitor(ctx));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerVisitors,
};
export default plugin;
