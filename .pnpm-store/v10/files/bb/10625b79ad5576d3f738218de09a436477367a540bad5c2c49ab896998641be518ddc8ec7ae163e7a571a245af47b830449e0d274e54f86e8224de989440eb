import { hasDependency } from '../../util/plugin.js';
import { createNanoSpawnVisitor } from './visitors/nano-spawn.js';
const title = 'nano-spawn';
const enablers = ['nano-spawn'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createNanoSpawnVisitor(ctx));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerVisitors,
};
export default plugin;
