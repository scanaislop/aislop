import { Visitor } from 'oxc-parser';
import stripJsonComments from 'strip-json-comments';
import { extname, isInternal } from '../util/path.js';
import { _parseFile, getStringValue } from './ast-nodes.js';
export const getPropertyKey = (prop) => prop?.key?.type === 'Identifier' ? prop.key.name : getStringValue(prop?.key);
export const getImportMap = (program) => {
    const importMap = new Map();
    for (const node of program.body ?? []) {
        if (node.type === 'ImportDeclaration') {
            const importPath = getStringValue(node.source);
            if (!importPath)
                continue;
            for (const spec of node.specifiers ?? []) {
                if (spec.type === 'ImportDefaultSpecifier' && spec.local?.name) {
                    importMap.set(spec.local.name, importPath);
                }
                else if (spec.type === 'ImportSpecifier' && spec.local?.name) {
                    importMap.set(spec.local.name, importPath);
                }
            }
        }
        if (node.type === 'VariableDeclaration') {
            for (const decl of node.declarations ?? []) {
                if (decl.init?.type === 'CallExpression' &&
                    decl.init.callee?.type === 'Identifier' &&
                    decl.init.callee.name === 'require' &&
                    decl.id?.type === 'Identifier') {
                    const source = getStringValue(decl.init.arguments?.[0]);
                    if (source != null)
                        importMap.set(decl.id.name, source);
                }
            }
        }
    }
    return importMap;
};
const addStringValue = (values, node) => {
    const value = getStringValue(node);
    if (value != null)
        values.add(value);
};
export const getPropertyValues = (node, propertyName) => {
    const values = new Set();
    if (node?.type !== 'ObjectExpression')
        return values;
    for (const prop of node.properties ?? []) {
        if (prop.type !== 'Property')
            continue;
        if (getPropertyKey(prop) !== propertyName)
            continue;
        const init = prop.value;
        if (init?.type === 'ArrayExpression') {
            for (const el of init.elements ?? [])
                addStringValue(values, el);
        }
        else if (init?.type === 'ObjectExpression') {
            for (const p of init.properties ?? []) {
                if (p.type === 'Property')
                    addStringValue(values, p.value);
            }
        }
        else {
            addStringValue(values, init);
        }
    }
    return values;
};
export const collectPropertyValues = (program, propertyName) => {
    const values = new Set();
    const visitor = new Visitor({
        ObjectExpression(node) {
            for (const v of getPropertyValues(node, propertyName))
                values.add(v);
        },
    });
    visitor.visit(program);
    return values;
};
const firstValue = (values) => {
    for (const value of values)
        return value;
};
export const getFirstPropertyValue = (node, propertyName) => firstValue(getPropertyValues(node, propertyName));
export const collectFirstPropertyValue = (program, propertyName) => firstValue(collectPropertyValues(program, propertyName));
const unwrapParens = (node) => node?.type === 'ParenthesizedExpression' ? unwrapParens(node.expression) : node;
export const resolveObjectArg = (arg) => {
    const node = unwrapParens(arg);
    if (!node)
        return;
    if (node.type === 'ObjectExpression')
        return node;
    if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression')
        return;
    const body = unwrapParens(node.body);
    if (body?.type === 'ObjectExpression')
        return body;
    if (body?.type !== 'BlockStatement')
        return;
    for (const stmt of body.body ?? []) {
        if (stmt.type === 'ReturnStatement') {
            const ret = unwrapParens(stmt.argument);
            if (ret?.type === 'ObjectExpression')
                return ret;
        }
    }
};
export const findImportedCalls = (program, module) => {
    const isMatch = typeof module === 'function'
        ? module
        : Array.isArray(module)
            ? (path) => module.includes(path)
            : (path) => path === module;
    const names = new Set();
    for (const [name, path] of getImportMap(program))
        if (isMatch(path))
            names.add(name);
    const calls = [];
    if (names.size === 0)
        return calls;
    const visitor = new Visitor({
        CallExpression(node) {
            if (node.callee?.type === 'Identifier' && names.has(node.callee.name))
                calls.push(node);
        },
    });
    visitor.visit(program);
    return calls;
};
export const findImportedCallArg = (program, module) => {
    for (const call of findImportedCalls(program, module)) {
        const arg = resolveObjectArg(call.arguments?.[0]);
        if (arg)
            return arg;
    }
};
export const findCallArg = (program, fnName) => {
    let result;
    const visitor = new Visitor({
        CallExpression(node) {
            if (result)
                return;
            if (node.callee?.type === 'Identifier' && node.callee.name === fnName) {
                const obj = resolveObjectArg(node.arguments?.[0]);
                if (obj)
                    result = obj;
            }
        },
    });
    visitor.visit(program);
    return result;
};
export const findProperty = (node, name) => {
    if (node?.type !== 'ObjectExpression')
        return;
    for (const prop of node.properties ?? []) {
        if (prop.type === 'Property' && getPropertyKey(prop) === name)
            return prop.value;
    }
};
export const getStringValues = (node) => {
    const values = new Set();
    if (node?.type !== 'ArrayExpression')
        return values;
    for (const el of node.elements ?? []) {
        if (el?.type === 'ArrayExpression')
            addStringValue(values, el.elements?.[0]);
        else
            addStringValue(values, el);
    }
    return values;
};
export const isExternalReExportsOnly = (result) => {
    const mod = result.module;
    if (mod.staticExports.length === 0)
        return false;
    for (const se of mod.staticExports) {
        for (const entry of se.entries) {
            if (!entry.moduleRequest)
                return false;
            if (isInternal(entry.moduleRequest.value))
                return false;
        }
    }
    if (mod.staticImports.length > 0)
        return false;
    return true;
};
export const hasImportSpecifier = (program, modulePath, specifierName) => {
    for (const node of program.body ?? []) {
        if (node.type !== 'ImportDeclaration' || getStringValue(node.source) !== modulePath)
            continue;
        for (const spec of node.specifiers ?? []) {
            if (spec.type === 'ImportSpecifier') {
                const imported = spec.imported?.name ?? spec.local?.name;
                if (imported === specifierName)
                    return true;
            }
        }
    }
    return false;
};
const collectJsonStringLiterals = (obj, literals) => {
    if (typeof obj === 'string') {
        literals.add(obj);
    }
    else if (Array.isArray(obj)) {
        for (const item of obj)
            collectJsonStringLiterals(item, literals);
    }
    else if (obj && typeof obj === 'object') {
        for (const val of Object.values(obj))
            collectJsonStringLiterals(val, literals);
    }
};
export const collectStringLiterals = (sourceText, filePath) => {
    const literals = new Set();
    try {
        const ext = extname(filePath);
        if (ext === '.json' || ext === '.jsonc' || ext === '.json5') {
            collectJsonStringLiterals(JSON.parse(stripJsonComments(sourceText, { trailingCommas: true })), literals);
            return literals;
        }
        const result = _parseFile(filePath, sourceText);
        const visitor = new Visitor({
            Literal(node) {
                if (typeof node.value === 'string')
                    literals.add(node.value);
            },
        });
        visitor.visit(result.program);
    }
    catch { }
    return literals;
};
