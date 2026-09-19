import { Visitor } from 'oxc-parser';
import { collectPropertyValues, getImportMap } from '../../typescript/ast-helpers.js';
import { _parseFile } from '../../typescript/ast-nodes.js';
import { toDeferResolveProductionEntry } from '../../util/input.js';
import { dirname } from '../../util/path.js';
import { _resolveSync } from '../../util/resolve.js';
export const resolveFromAST = (program, options) => {
    const entries = new Set();
    const addHandlers = (values) => {
        for (const specifier of values)
            entries.add(specifier.substring(0, specifier.lastIndexOf('.')));
    };
    try {
        const importMap = getImportMap(program);
        addHandlers(collectPropertyValues(program, 'handler'));
        const visitor = new Visitor({
            CallExpression(node) {
                if (node.callee?.type !== 'MemberExpression')
                    return;
                const propName = !node.callee.computed ? node.callee.property?.name : undefined;
                if (propName === 'stack') {
                    const arg = node.arguments?.[0];
                    if (arg?.type === 'Identifier') {
                        const importPath = importMap.get(arg.name);
                        if (importPath) {
                            const resolvedPath = _resolveSync(importPath, dirname(options.configFilePath));
                            if (resolvedPath) {
                                const stackText = options.readFile(resolvedPath);
                                if (stackText) {
                                    const stackResult = _parseFile('stack.ts', stackText);
                                    addHandlers(collectPropertyValues(stackResult.program, 'handler'));
                                }
                            }
                        }
                    }
                }
                if (propName === 'route' && node.arguments?.length >= 2) {
                    const handlerArg = node.arguments[1];
                    if (handlerArg?.type === 'Literal' && typeof handlerArg.value === 'string')
                        entries.add(handlerArg.value);
                }
            },
        });
        visitor.visit(program);
    }
    catch { }
    return Array.from(entries).map(specifier => toDeferResolveProductionEntry(specifier, { containingFilePath: options.configFilePath }));
};
