import { hasDependency } from '../../util/plugin.js';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.js';
const title = 'Catalyst';
const enablers = ['@github/catalyst'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isCatalystSpecifier = (specifier) => specifier === '@github/catalyst';
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createCustomElementVisitor(ctx, isCatalystSpecifier, { decoratorName: 'controller' }));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerVisitors,
};
export default plugin;
