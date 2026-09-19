import LESS from './less.js';
import MDX from './mdx.js';
import SCSS from './scss.js';
import STYLUS from './stylus.js';
import TSRX from './tsrx.js';
const isAsyncCompiler = (fn) => (fn ? fn.constructor.name === 'AsyncFunction' : false);
export const normalizeCompilerExtension = (ext) => ext.replace(/^\.*/, '.');
export const partitionCompilers = (rawLocalConfig) => {
    const syncCompilers = {};
    const asyncCompilers = {};
    for (const extension in rawLocalConfig.compilers) {
        const ext = normalizeCompilerExtension(extension);
        const compilerFn = rawLocalConfig.compilers[extension];
        if (typeof compilerFn === 'function') {
            if (!rawLocalConfig.asyncCompilers?.[ext] && isAsyncCompiler(compilerFn)) {
                asyncCompilers[ext] = compilerFn;
            }
            else {
                syncCompilers[ext] = compilerFn;
            }
        }
        else if (compilerFn === true) {
            syncCompilers[ext] = true;
        }
    }
    for (const extension in rawLocalConfig.asyncCompilers) {
        const ext = normalizeCompilerExtension(extension);
        asyncCompilers[ext] = rawLocalConfig.asyncCompilers[extension];
    }
    return { ...rawLocalConfig, syncCompilers, asyncCompilers };
};
const compilers = [
    { extensions: ['.mdx'], ...MDX },
    { extensions: ['.sass', '.scss'], ...SCSS },
    { extensions: ['.less'], ...LESS },
    { extensions: ['.styl', '.stylus'], ...STYLUS },
    { extensions: ['.tsrx'], ...TSRX },
];
export const getIncludedCompilers = (syncCompilers, asyncCompilers, dependencies, onReferencedDependency) => {
    for (const { extensions, dependencies: compilerDependencies, compiler } of compilers) {
        let hasCompilerDependency = false;
        for (const dependency of compilerDependencies) {
            if (dependencies.has(dependency)) {
                hasCompilerDependency = true;
                if (onReferencedDependency)
                    onReferencedDependency(dependency);
                else
                    break;
            }
        }
        for (const extension of extensions) {
            const existingCompiler = syncCompilers.get(extension);
            if (existingCompiler === true || (existingCompiler === undefined && hasCompilerDependency)) {
                syncCompilers.set(extension, compiler);
            }
        }
    }
    return [syncCompilers, asyncCompilers];
};
export const getCompilerExtensions = (compilers) => [
    ...compilers[0].keys(),
    ...compilers[1].keys(),
];
