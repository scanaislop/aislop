import { getStringValue, isStringLiteral } from '../../../typescript/ast-nodes.js';
export function createImportMetaGlobVisitor(ctx) {
    return {
        CallExpression(node) {
            if (node.callee.type !== 'MemberExpression' ||
                node.callee.computed ||
                node.callee.object.type !== 'MetaProperty' ||
                node.callee.property.name !== 'glob' ||
                node.arguments.length < 1)
                return;
            const arg = node.arguments[0];
            let patterns;
            if (isStringLiteral(arg)) {
                patterns = [getStringValue(arg)];
            }
            else if (arg.type === 'ArrayExpression') {
                patterns = [];
                for (const e of arg.elements) {
                    if (e && isStringLiteral(e))
                        patterns.push(getStringValue(e));
                }
            }
            if (!patterns?.length)
                return;
            ctx.addImportGlob(patterns);
        },
    };
}
