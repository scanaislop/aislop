import { blockCommentMatcher, lineCommentMatcher, scriptExtractor } from '../../compilers/compilers.js';
import { findImportedCalls, findProperty, getStringValues } from '../../typescript/ast-helpers.js';
import { getStringValue } from '../../typescript/ast-nodes.js';
import { isFile, loadFile } from '../../util/fs.js';
import { toProductionEntry } from '../../util/input.js';
import { dirname, join } from '../../util/path.js';
import { getDependenciesFromConfig } from '../babel/index.js';
const babelPluginSources = ['@rolldown/plugin-babel', '@vitejs/plugin-react', 'vite-plugin-babel'];
const isBabelWrappingPlugin = (path) => babelPluginSources.some(source => path === source || path.startsWith(`${source}/`));
export const getBabelInputs = (program) => {
    const inputs = [];
    for (const call of findImportedCalls(program, isBabelWrappingPlugin)) {
        const options = call.arguments?.[0];
        const plugins = [];
        const presets = [];
        for (const config of [options, findProperty(options, 'babel'), findProperty(options, 'babelConfig')]) {
            plugins.push(...getStringValues(findProperty(config, 'plugins')));
            presets.push(...getStringValues(findProperty(config, 'presets')));
        }
        inputs.push(...getDependenciesFromConfig({ plugins, presets }));
    }
    return inputs;
};
const moduleTypePattern = /\btype\s*=\s*["']?module["']?/i;
const srcAttrPattern = /\bsrc\s*=\s*["']([^"']+)["']/i;
const importSpecPattern = /\bimport\b(?:\s*\(\s*|(?:[\w$*,{}\s]*\bfrom\b)?\s*)(['"])([^'"]+)\1/g;
const isFilePath = (specifier) => specifier.startsWith('/') || specifier.startsWith('./') || specifier.startsWith('../');
const normalizeModuleScriptSrc = (value) => value.trim().replace(/^\//, '');
const getModuleScriptSources = (html) => {
    const sources = [];
    for (const [, attrs, body] of html.matchAll(scriptExtractor)) {
        if (!moduleTypePattern.test(attrs))
            continue;
        const srcMatch = attrs.match(srcAttrPattern);
        if (srcMatch) {
            const src = normalizeModuleScriptSrc(srcMatch[1]);
            if (src)
                sources.push(src);
            continue;
        }
        if (body) {
            const code = body.replace(blockCommentMatcher, '').replace(lineCommentMatcher, '');
            for (const importMatch of code.matchAll(importSpecPattern)) {
                const specifier = importMatch[2];
                if (isFilePath(specifier))
                    sources.push(normalizeModuleScriptSrc(specifier));
            }
        }
    }
    return sources;
};
export const getHtmlScriptEntries = async (htmlPath) => {
    if (!isFile(htmlPath))
        return [];
    const html = await loadFile(htmlPath);
    const dir = dirname(htmlPath);
    return getModuleScriptSources(html).map(src => toProductionEntry(join(dir, src)));
};
export const getIndexHtmlEntries = (rootDir) => getHtmlScriptEntries(join(rootDir, 'index.html'));
export const getVitePluginDirs = (program, specifiers, key) => {
    let dirs;
    for (const call of findImportedCalls(program, specifiers)) {
        const value = findProperty(call.arguments?.[0], key);
        if (!value)
            continue;
        const collected = [];
        const single = getStringValue(value);
        if (single !== undefined)
            collected.push(single);
        else if (value.type === 'ArrayExpression') {
            for (const element of value.elements ?? []) {
                const str = getStringValue(element);
                if (str !== undefined)
                    collected.push(str);
                else if (element?.type === 'ObjectExpression') {
                    const dir = getStringValue(findProperty(element, 'dir'));
                    if (dir !== undefined)
                        collected.push(dir);
                }
            }
        }
        if (collected.length > 0)
            dirs = collected;
    }
    return dirs;
};
