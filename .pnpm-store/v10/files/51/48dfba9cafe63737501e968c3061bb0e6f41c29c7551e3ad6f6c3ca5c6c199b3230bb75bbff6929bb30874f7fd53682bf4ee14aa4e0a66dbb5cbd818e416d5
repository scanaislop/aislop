import { existsSync } from 'node:fs';
import { _syncGlob } from '../util/glob.js';
import { dirname, isAbsolute, join, toAbsolute, toRelative } from '../util/path.js';
function resolveBaseDir(base, dir, resolveGlobPattern) {
    if (base.startsWith('.'))
        return join(dir, base);
    if (isAbsolute(base))
        return base;
    for (const resolved of resolveGlobPattern(base, dir)) {
        if (resolved !== base && existsSync(resolved))
            return resolved;
    }
    return undefined;
}
export function resolveImportGlobs(items, containingFile, resolveGlobPattern, workspaceRoot) {
    const filePaths = [];
    const dir = dirname(containingFile);
    for (const { patterns, base, cwd, filter } of items) {
        if (cwd !== undefined) {
            for (const filePath of _syncGlob({ patterns, cwd: toAbsolute(cwd, workspaceRoot) })) {
                filePaths.push(filePath);
            }
        }
        else if (base !== undefined) {
            const cwd = resolveBaseDir(base, dir, resolveGlobPattern);
            if (!cwd)
                continue;
            for (const filePath of _syncGlob({ patterns, cwd })) {
                if (!filter || filter.test(`./${toRelative(filePath, cwd)}`))
                    filePaths.push(filePath);
            }
        }
        else {
            const resolved = [];
            for (const pattern of patterns) {
                const isNegated = pattern[0] === '!';
                const specifier = isNegated ? pattern.slice(1) : pattern;
                if (specifier[0] === '/') {
                    const rooted = join(workspaceRoot, specifier);
                    resolved.push(isNegated ? `!${rooted}` : rooted);
                }
                else {
                    for (const p of resolveGlobPattern(pattern, dir))
                        resolved.push(p);
                }
            }
            if (resolved.length === 0)
                continue;
            for (const filePath of _syncGlob({ patterns: resolved, cwd: dir }))
                filePaths.push(filePath);
        }
    }
    return filePaths;
}
