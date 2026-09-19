import { hasDependency } from '../../util/plugin.js';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.js';
const title = 'Lit';
const enablers = ['lit', 'lit-element', '@lit/reactive-element'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isLitDecoratorsSpecifier = (specifier) => specifier === 'lit/decorators.js' ||
    specifier === 'lit/decorators' ||
    specifier.startsWith('lit/decorators/') ||
    specifier === '@lit/reactive-element/decorators.js' ||
    specifier === '@lit/reactive-element/decorators' ||
    specifier.startsWith('@lit/reactive-element/decorators/') ||
    specifier === 'lit-element' ||
    specifier === 'lit-element/decorators.js' ||
    specifier === 'lit-element/decorators' ||
    specifier.startsWith('lit-element/decorators/');
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createCustomElementVisitor(ctx, isLitDecoratorsSpecifier));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerVisitors,
};
export default plugin;
