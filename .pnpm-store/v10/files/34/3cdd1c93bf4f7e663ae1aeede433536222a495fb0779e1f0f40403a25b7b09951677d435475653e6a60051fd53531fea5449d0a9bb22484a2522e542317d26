import fs from 'node:fs';
import path from 'node:path';
import { createDiskCache, mtimeMatches } from './disk-cache.js';
const store = createDiskCache('gitignore');
export const initGitignoreCache = store.init;
export const isGitignoreCacheEnabled = store.isEnabled;
export const flushGitignoreCache = store.flush;
const workspaceDirsKey = (workspaceDirs) => {
    if (!workspaceDirs || workspaceDirs.size === 0)
        return '';
    return [...workspaceDirs].sort().join('\0');
};
const validateEntry = (entry, wsKey, cwd) => {
    if (entry.workspaceDirsKey !== wsKey)
        return false;
    const { gitignoreFiles, mtimes } = entry;
    for (let i = 0; i < gitignoreFiles.length; i++) {
        const abs = path.isAbsolute(gitignoreFiles[i]) ? gitignoreFiles[i] : path.resolve(cwd, gitignoreFiles[i]);
        if (!mtimeMatches(abs, mtimes[i]))
            return false;
    }
    return true;
};
export const getCachedGitignore = (cwd, workspaceDirs) => {
    const entry = store.get(cwd);
    if (!entry)
        return undefined;
    const wsKey = workspaceDirsKey(workspaceDirs);
    if (!validateEntry(entry, wsKey, cwd)) {
        store.delete(cwd);
        return undefined;
    }
    const perDirIgnores = new Map();
    for (const dir in entry.perDirIgnores) {
        const data = entry.perDirIgnores[dir];
        perDirIgnores.set(dir, { ignores: new Set(data.ignores), unignores: new Set(data.unignores) });
    }
    return {
        ignores: new Set(entry.ignores),
        unignores: new Set(entry.unignores),
        gitignoreFiles: entry.gitignoreFiles,
        perDirIgnores,
    };
};
export const setCachedGitignore = (cwd, workspaceDirs, gitignoreFiles, ignores, unignores, perDirIgnores) => {
    if (!store.isEnabled())
        return;
    const mtimes = [];
    const validFiles = [];
    for (const file of gitignoreFiles) {
        const abs = path.isAbsolute(file) ? file : path.resolve(cwd, file);
        try {
            const stat = fs.statSync(abs, { throwIfNoEntry: false });
            if (!stat)
                continue;
            mtimes.push(stat.mtimeMs);
            validFiles.push(file);
        }
        catch {
        }
    }
    const perDir = {};
    for (const [dir, data] of perDirIgnores) {
        perDir[dir] = { ignores: [...data.ignores], unignores: [...data.unignores] };
    }
    store.set(cwd, {
        gitignoreFiles: validFiles,
        mtimes,
        ignores: [...ignores],
        unignores: [...unignores],
        perDirIgnores: perDir,
        workspaceDirsKey: workspaceDirsKey(workspaceDirs),
    });
};
