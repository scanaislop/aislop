import { parseTsconfig } from 'get-tsconfig';
import { compact } from './array.js';
import { isFile } from './fs.js';
import { _syncGlob } from './glob.js';
import { dirname, isAbsolute, join, toAbsolute, toPosix } from './path.js';
const hasGlobChar = (p) => p.includes('*') || p.includes('?');
const hasExtension = (p) => {
    const last = p.lastIndexOf('/');
    const base = last >= 0 ? p.slice(last + 1) : p;
    return base !== '.' && base !== '..' && base.includes('.');
};
const resolvePatterns = (patterns, dir, expandDirs = false) => {
    if (!patterns)
        return undefined;
    return patterns.map(p => {
        const resolved = isAbsolute(p) ? p : join(dir, p);
        return expandDirs && !hasGlobChar(p) && !hasExtension(p) ? join(resolved, '**/*') : resolved;
    });
};
const getImplicitBaseUrl = (compilerOptions) => {
    for (const symbol of Object.getOwnPropertySymbols(compilerOptions)) {
        if (symbol.description === 'implicitBaseUrl') {
            const value = Reflect.get(compilerOptions, symbol);
            if (typeof value === 'string')
                return toPosix(value);
        }
    }
};
const pathsBaseDir = (compilerOptions, dir) => {
    if (compilerOptions?.baseUrl)
        return toAbsolute(compilerOptions.baseUrl, dir);
    return (compilerOptions && getImplicitBaseUrl(compilerOptions)) ?? dir;
};
const collectPaths = (acc, paths, baseDir) => {
    if (!paths)
        return;
    for (const key in paths) {
        const resolved = paths[key].map(p => toAbsolute(p, baseDir));
        acc[key] = key in acc ? compact([...acc[key], ...resolved]) : resolved;
    }
};
const DEFAULT_INCLUDE = ['**/*'];
const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const isDtsExt = /\.d\.(m|c)?ts$/;
const isTsRelevant = (filePath) => {
    if (isDtsExt.test(filePath))
        return true;
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    return TS_EXTENSIONS.has(ext);
};
const expandFileNames = (dir, compilerOptions, include, exclude, files) => {
    const result = [];
    if (files) {
        for (const file of files)
            result.push(file);
    }
    const effectiveExclude = [...(exclude ?? []), join(dir, 'node_modules/**')];
    if (compilerOptions.outDir) {
        effectiveExclude.push(join(compilerOptions.outDir, '**'));
    }
    const effectiveInclude = include ?? (files ? undefined : DEFAULT_INCLUDE.map(p => join(dir, p)));
    if (effectiveInclude) {
        const negated = effectiveExclude.map(p => `!${p}`);
        const globbed = _syncGlob({ patterns: [...effectiveInclude, ...negated], cwd: dir });
        for (const f of globbed)
            if (isTsRelevant(f))
                result.push(f);
    }
    return result;
};
const resolveReference = (refPath, dir) => {
    const abs = isAbsolute(refPath) ? refPath : join(dir, refPath);
    if (isFile(abs))
        return abs;
    const withTsconfig = join(abs, 'tsconfig.json');
    return isFile(withTsconfig) ? withTsconfig : undefined;
};
const absDir = (path, dir) => toAbsolute(path, dir).replace(/\/+$/, '');
const walkReferences = (target, references, dir, visited, pairs, paths) => {
    if (!references?.length)
        return;
    for (const ref of references) {
        const refPath = resolveReference(ref.path, dir);
        if (!refPath || visited.has(refPath))
            continue;
        visited.add(refPath);
        const refConfig = parseTsconfig(refPath);
        const refDir = dirname(refPath);
        const refOpts = refConfig.compilerOptions;
        collectPaths(paths, refOpts?.paths, pathsBaseDir(refOpts, refDir));
        const refOutDir = refOpts?.outDir ? absDir(refOpts.outDir, refDir) : undefined;
        const refRootDir = refOpts?.rootDir ? absDir(refOpts.rootDir, refDir) : undefined;
        if (refOutDir && refRootDir && refOutDir !== refRootDir)
            pairs.push({ srcDir: refRootDir, outDir: refOutDir });
        if (refOutDir && !target.outDir)
            target.outDir = refOutDir;
        if (refRootDir && !target.rootDir)
            target.rootDir = refRootDir;
        if (!refOutDir || !refRootDir)
            walkReferences(target, refConfig.references, refDir, visited, pairs, paths);
    }
};
const EMPTY = {
    compilerOptions: {},
    fileNames: [],
    include: undefined,
    exclude: undefined,
    sourceMapPairs: [],
    paths: undefined,
};
export const loadTSConfig = async (tsConfigFilePath) => {
    if (!isFile(tsConfigFilePath))
        return { isFile: false, ...EMPTY };
    try {
        const config = parseTsconfig(tsConfigFilePath);
        const dir = dirname(tsConfigFilePath);
        const compilerOptions = (config.compilerOptions ?? {});
        if (compilerOptions.outDir)
            compilerOptions.outDir = absDir(compilerOptions.outDir, dir);
        if (compilerOptions.rootDir)
            compilerOptions.rootDir = absDir(compilerOptions.rootDir, dir);
        if (compilerOptions.rootDirs)
            compilerOptions.rootDirs = compilerOptions.rootDirs.map(d => absDir(d, dir));
        const tsconfigPaths = {};
        collectPaths(tsconfigPaths, compilerOptions.paths, pathsBaseDir(compilerOptions, dir));
        const sourceMapPairs = [];
        if (config.references?.length) {
            walkReferences(compilerOptions, config.references, dir, new Set([tsConfigFilePath]), sourceMapPairs, tsconfigPaths);
        }
        const include = resolvePatterns(config.include, dir, true);
        const exclude = resolvePatterns(config.exclude, dir, true);
        const files = resolvePatterns(config.files, dir);
        const fileNames = expandFileNames(dir, compilerOptions, include, exclude, files);
        const paths = Object.keys(tsconfigPaths).length > 0 ? tsconfigPaths : undefined;
        return { isFile: true, compilerOptions, fileNames, include, exclude, sourceMapPairs, paths };
    }
    catch {
        return { isFile: true, ...EMPTY };
    }
};
