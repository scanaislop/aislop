import { getScriptFromTemplate } from '../ast-nodes.js';
export function createBunShellVisitor(ctx) {
    return {
        TaggedTemplateExpression(node) {
            const tag = node.tag;
            if (tag.type === 'Identifier' && tag.name === '$') {
                const script = getScriptFromTemplate(node.quasi);
                if (script)
                    ctx.addScript(script);
            }
        },
    };
}
