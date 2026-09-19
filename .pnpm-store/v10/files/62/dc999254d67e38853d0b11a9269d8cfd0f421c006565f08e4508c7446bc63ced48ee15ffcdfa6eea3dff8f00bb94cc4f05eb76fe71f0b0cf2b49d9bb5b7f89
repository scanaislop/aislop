import scss from '../../compilers/scss.js';
import { IMPORT_FLAGS } from '../../constants.js';
import { getPropertyValues } from '../../typescript/ast-helpers.js';
import { dirname, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.js';
import { entry, resolveFromAST } from './resolveFromAST.js';
const title = 'Stencil';
const enablers = ['@stencil/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['stencil.config.{ts,js}'];
const production = ['src/**/*.tsx'];
const isStencilSpecifier = (specifier) => specifier === '@stencil/core';
const registerCompilers = ({ hasDependency, registerCompiler }) => {
    if (hasDependency('@stencil/sass'))
        for (const ext of ['.scss', '.sass'])
            registerCompiler({ extension: ext, compiler: scss.compiler });
};
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createCustomElementVisitor(ctx, isStencilSpecifier, { decoratorName: 'Component' }));
    const componentNames = new Set();
    registerVisitor({
        Program() {
            componentNames.clear();
        },
        ImportDeclaration(node) {
            if (!isStencilSpecifier(node.source?.value))
                return;
            for (const spec of node.specifiers ?? []) {
                if (spec.type === 'ImportSpecifier' &&
                    spec.imported.type === 'Identifier' &&
                    spec.imported.name === 'Component')
                    componentNames.add(spec.local.name);
            }
        },
        ClassDeclaration(node) {
            resolveStyleUrls(node);
        },
    });
    function resolveStyleUrls(node) {
        const dir = dirname(ctx.filePath);
        for (const decorator of node.decorators ?? []) {
            const expr = decorator.expression;
            if (expr?.type !== 'CallExpression')
                continue;
            if (expr.callee?.type !== 'Identifier' || !componentNames.has(expr.callee.name))
                continue;
            const arg = expr.arguments?.[0];
            if (arg?.type !== 'ObjectExpression')
                continue;
            for (const url of getPropertyValues(arg, 'styleUrl'))
                ctx.addImport(join(dir, url), arg.start, IMPORT_FLAGS.NONE);
            for (const url of getPropertyValues(arg, 'styleUrls'))
                ctx.addImport(join(dir, url), arg.start, IMPORT_FLAGS.NONE);
        }
    }
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    production,
    resolveFromAST,
    registerCompilers,
    registerVisitors,
};
export default plugin;
