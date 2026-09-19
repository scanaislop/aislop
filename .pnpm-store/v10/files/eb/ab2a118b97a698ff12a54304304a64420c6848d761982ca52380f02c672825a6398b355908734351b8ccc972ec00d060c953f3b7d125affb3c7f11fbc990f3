import { hasDependency } from '../../util/plugin.js';
import { createPinoTransportVisitor } from './visitors/transportCall.js';
const title = 'pino';
const enablers = ['pino'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createPinoTransportVisitor(ctx));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerVisitors,
};
export default plugin;
