import { hasDependency } from '../../util/plugin.js';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.js';
const title = 'FAST';
const enablers = ['@microsoft/fast-element'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isFastSpecifier = (specifier) => specifier === '@microsoft/fast-element';
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createCustomElementVisitor(ctx, isFastSpecifier, { baseClassName: 'FASTElement' }));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerVisitors,
};
export default plugin;
