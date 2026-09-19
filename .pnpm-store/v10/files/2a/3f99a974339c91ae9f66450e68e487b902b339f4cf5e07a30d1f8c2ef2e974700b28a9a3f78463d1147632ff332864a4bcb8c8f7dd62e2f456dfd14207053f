import { getScriptFromTemplate } from '../../../typescript/ast-nodes.js';
export function createZxVisitor(ctx) {
    return {
        TaggedTemplateExpression(node) {
            if (!ctx.sourceText.startsWith('#!/usr/bin/env zx'))
                return;
            if (node.tag.type === 'Identifier' && node.tag.name === '$') {
                const script = getScriptFromTemplate(node.quasi);
                if (script)
                    ctx.addScript(script);
            }
        },
    };
}
