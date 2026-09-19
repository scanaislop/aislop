function isCustomElementDecorated(node, names, namespaces, decoratorName) {
    const decorators = node.decorators;
    if (!decorators || decorators.length === 0)
        return false;
    for (const decorator of decorators) {
        const expression = decorator.expression;
        if (expression?.type === 'Identifier') {
            if (names.has(expression.name))
                return true;
            continue;
        }
        if (expression?.type !== 'CallExpression')
            continue;
        const callee = expression.callee;
        if (callee.type === 'Identifier') {
            if (names.has(callee.name))
                return true;
        }
        else if (callee.type === 'MemberExpression' &&
            !callee.computed &&
            callee.object.type === 'Identifier' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === decoratorName &&
            namespaces.has(callee.object.name)) {
            return true;
        }
    }
    return false;
}
function extendsBaseClass(node, baseNames) {
    const superClass = node.superClass;
    if (!superClass)
        return false;
    if (superClass.type === 'Identifier')
        return baseNames.has(superClass.name);
    if (superClass.type === 'CallExpression') {
        for (const arg of superClass.arguments) {
            if (arg.type === 'Identifier' && baseNames.has(arg.name))
                return true;
        }
    }
    return false;
}
export function createCustomElementVisitor(ctx, isRegistrationSpecifier, { decoratorName = 'customElement', baseClassName } = {}) {
    const decoratorNames = new Set();
    const namespaces = new Set();
    const baseNames = new Set();
    const definedClasses = new Set();
    let depth = 0;
    const visitor = {
        Program() {
            decoratorNames.clear();
            namespaces.clear();
            baseNames.clear();
            definedClasses.clear();
            depth = 0;
        },
        BlockStatement() {
            depth++;
        },
        'BlockStatement:exit'() {
            depth--;
        },
        ImportDeclaration(node) {
            if (!node.source || !isRegistrationSpecifier(node.source.value))
                return;
            for (const spec of node.specifiers ?? []) {
                if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
                    if (spec.imported.name === decoratorName)
                        decoratorNames.add(spec.local.name);
                    else if (baseClassName && spec.imported.name === baseClassName)
                        baseNames.add(spec.local.name);
                }
                else if (spec.type === 'ImportNamespaceSpecifier') {
                    namespaces.add(spec.local.name);
                }
            }
        },
        ClassDeclaration(node) {
            if (depth !== 0 || !node.id?.name)
                return;
            if (isCustomElementDecorated(node, decoratorNames, namespaces, decoratorName))
                ctx.markExportRegistered(node.id.name);
            else if (baseClassName && extendsBaseClass(node, baseNames))
                definedClasses.add(node.id.name);
        },
        ExportDefaultDeclaration(node) {
            if (node.declaration.type === 'ClassDeclaration' &&
                isCustomElementDecorated(node.declaration, decoratorNames, namespaces, decoratorName))
                ctx.markExportRegistered('default');
        },
    };
    if (baseClassName) {
        visitor.CallExpression = node => {
            const callee = node.callee;
            if (callee.type === 'MemberExpression' &&
                !callee.computed &&
                callee.object.type === 'Identifier' &&
                callee.property.type === 'Identifier' &&
                (callee.property.name === 'define' || callee.property.name === 'defineAsync') &&
                definedClasses.has(callee.object.name))
                ctx.markExportRegistered(callee.object.name);
        };
    }
    return visitor;
}
