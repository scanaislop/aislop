import { Visitor } from 'oxc-parser';
import { toDeferResolve } from '../../util/input.js';
import { findProperty, getPropertyKey } from '../../typescript/ast-helpers.js';
import { getStringValue } from '../../typescript/ast-nodes.js';
import { isInternal } from '../../util/path.js';
export const getInputsFromSettingsAST = (program) => {
    const inputs = [];
    const addResolver = (key, resolver) => {
        if (!resolver || resolver === 'node' || isInternal(resolver))
            return;
        const dep = key === 'import/resolver' ? `eslint-import-resolver-${resolver}` : resolver;
        inputs.push(toDeferResolve(dep, { optional: true }));
    };
    const visitor = new Visitor({
        ObjectExpression(node) {
            const settingsNode = findProperty(node, 'settings');
            if (!settingsNode || settingsNode.type !== 'ObjectExpression')
                return;
            for (const prop of settingsNode.properties ?? []) {
                if (prop.type !== 'Property')
                    continue;
                const key = getPropertyKey(prop);
                if (key !== 'import/resolver' && key !== 'import/parsers')
                    continue;
                if (prop.value?.type === 'ObjectExpression') {
                    for (const p of prop.value.properties ?? []) {
                        if (p.type === 'Property')
                            addResolver(key, getPropertyKey(p));
                    }
                }
                else {
                    addResolver(key, getStringValue(prop.value));
                }
            }
        },
    });
    visitor.visit(program);
    return inputs;
};
export const getInputsFromFlatConfigAST = (program) => [
    ...getInputsFromSettingsAST(program),
    toDeferResolve('eslint-import-resolver-typescript', { optional: true }),
];
