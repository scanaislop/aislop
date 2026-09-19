import { findImportedCalls, findProperty, getStringValues } from '../../typescript/ast-helpers.js';
import { getStringValue } from '../../typescript/ast-nodes.js';
import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
const enablers = ['laravel-vite-plugin'];
const addStringOrArray = (values, node) => {
    const single = getStringValue(node);
    if (single !== undefined)
        values.add(single);
    for (const value of getStringValues(node))
        values.add(value);
};
export const resolveFromAST = (program, options) => {
    const inputs = [];
    for (const call of findImportedCalls(program, enablers)) {
        const arg = call.arguments?.[0];
        if (!arg)
            continue;
        const specifiers = new Set();
        addStringOrArray(specifiers, arg);
        addStringOrArray(specifiers, findProperty(arg, 'input'));
        addStringOrArray(specifiers, findProperty(arg, 'ssr'));
        for (const id of specifiers)
            inputs.push(toProductionEntry(join(options.configFileDir, id)));
    }
    return inputs;
};
