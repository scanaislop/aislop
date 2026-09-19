import { findImportedCalls, findProperty, getStringValues } from '../../typescript/ast-helpers.js';
import { toDependency, toProductionEntry } from '../../util/input.js';
export const production = ['{src/,}mdx-components.{js,jsx,ts,tsx}'];
const getMdxPlugins = (program) => {
    const plugins = new Set();
    for (const call of findImportedCalls(program, '@next/mdx')) {
        const options = findProperty(call.arguments?.[0], 'options');
        if (options?.type !== 'ObjectExpression')
            continue;
        for (const pluginType of ['remarkPlugins', 'rehypePlugins', 'recmaPlugins']) {
            for (const v of getStringValues(findProperty(options, pluginType)))
                plugins.add(v);
        }
    }
    return plugins;
};
export const resolveFromAST = program => [
    ...production.map(id => toProductionEntry(id)),
    ...Array.from(getMdxPlugins(program)).map(id => toDependency(id)),
];
