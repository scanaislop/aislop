import { collectFirstPropertyValue, findImportedCallArg, findProperty, getPropertyKey, getPropertyValues, hasImportSpecifier, resolveObjectArg, } from '../../typescript/ast-helpers.js';
import { getStringValue } from '../../typescript/ast-nodes.js';
import { toConfig, toDependency, toEntry, toProductionEntry } from '../../util/input.js';
import { getAliasInputs } from '../vitest/helpers.js';
export const entry = ['src/content/config.ts', 'src/content.config.ts'];
export const production = [
    'src/pages/**/*.{astro,mdx,js,ts}',
    '!src/pages/**/_*',
    '!src/pages/**/_*/**',
    'src/content/**/*.mdx',
    'src/middleware.{js,ts}',
    'src/middleware/index.{js,ts}',
    'src/actions/index.{js,ts}',
];
const getSrcDir = (program) => collectFirstPropertyValue(program, 'srcDir') ?? 'src';
const usesPassthroughImageService = (program) => hasImportSpecifier(program, 'astro/config', 'passthroughImageService');
const findFirstStringArg = (node) => {
    const literal = getStringValue(node);
    if (literal)
        return literal;
    if (node?.type === 'CallExpression' || node?.type === 'NewExpression') {
        for (const arg of node.arguments ?? []) {
            const found = findFirstStringArg(arg);
            if (found)
                return found;
        }
    }
};
const getViteAliases = (program) => {
    const aliases = {};
    for (const node of program.body ?? []) {
        if (node.type !== 'ExportDefaultDeclaration')
            continue;
        const decl = node.declaration;
        const root = decl?.type === 'CallExpression' ? resolveObjectArg(decl.arguments?.[0]) : resolveObjectArg(decl);
        const aliasNode = findProperty(findProperty(findProperty(root, 'vite'), 'resolve'), 'alias');
        if (aliasNode?.type !== 'ObjectExpression')
            continue;
        for (const prop of aliasNode.properties ?? []) {
            if (prop.type !== 'Property')
                continue;
            const key = getPropertyKey(prop);
            if (!key)
                continue;
            const raw = findFirstStringArg(prop.value);
            if (raw)
                aliases[key] = raw;
        }
    }
    return aliases;
};
export const resolveFromAST = (program, options) => {
    const srcDir = getSrcDir(program);
    const setSrcDir = (entry) => entry.replace(/^src\//, `${srcDir}/`);
    const inputs = [
        ...entry.map(setSrcDir).map(path => toEntry(path)),
        ...production.map(setSrcDir).map(path => toProductionEntry(path)),
        ...getAliasInputs(getViteAliases(program), options.cwd),
    ];
    if (!usesPassthroughImageService(program))
        inputs.push(toDependency('sharp', { optional: true }));
    const lunariaConfig = findImportedCallArg(program, '@lunariajs/starlight');
    if (lunariaConfig) {
        for (const id of getPropertyValues(lunariaConfig, 'configPath')) {
            inputs.push(toConfig('lunaria', id));
        }
    }
    return inputs;
};
