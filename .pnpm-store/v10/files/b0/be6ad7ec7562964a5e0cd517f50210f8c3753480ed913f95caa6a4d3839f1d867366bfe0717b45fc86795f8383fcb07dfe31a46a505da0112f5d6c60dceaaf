import { getSafeScriptFromArgs } from '../../../typescript/ast-nodes.js';
export function createNanoSpawnVisitor(ctx) {
    return {
        CallExpression(node) {
            if (node.callee.type !== 'Identifier' || node.callee.name !== 'spawn')
                return;
            const script = getSafeScriptFromArgs(node.arguments[0], node.arguments[1]);
            if (script)
                ctx.addScript(script);
        },
    };
}
