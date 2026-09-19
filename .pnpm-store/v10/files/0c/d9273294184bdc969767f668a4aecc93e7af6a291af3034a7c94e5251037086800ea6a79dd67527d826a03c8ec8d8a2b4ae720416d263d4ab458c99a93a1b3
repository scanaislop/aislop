import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createDiskCache } from './disk-cache.js';
const store = createDiskCache('glob');
const dirMtimeCache = new Map();
export const initGlobCache = (cacheLocation) => {
    dirMtimeCache.clear();
    store.init(cacheLocation);
};
export const isGlobCacheEnabled = store.isEnabled;
export const flushGlobCache = store.flush;
export const clearGlobCache = () => {
    dirMtimeCache.clear();
    store.clear();
};
export const computeGlobCacheKey = (input) => {
    const h = createHash('sha1');
    h.update(input.cwd);
    h.update('\0');
    h.update(input.dir);
    h.update('\0');
    h.update(input.gitignore ? '1' : '0');
    h.update('\0');
    h.update(input.gitignoreFingerprint);
    h.update('\0');
    for (const p of input.patterns) {
        h.update(p);
        h.update('\0');
    }
    return h.digest('base64url');
};
const statDirMtime = (dir) => {
    let mtime = dirMtimeCache.get(dir);
    if (mtime === undefined) {
        try {
            const stat = fs.statSync(dir, { throwIfNoEntry: false });
            mtime = stat?.isDirectory() ? stat.mtimeMs : Number.NaN;
        }
        catch {
            mtime = Number.NaN;
        }
        dirMtimeCache.set(dir, mtime);
    }
    return mtime;
};
const validateEntry = (entry) => {
    for (const dir in entry.dirMtimes) {
        if (statDirMtime(dir) !== entry.dirMtimes[dir])
            return false;
    }
    return true;
};
export const getCachedGlob = (key) => {
    const entry = store.get(key);
    if (!entry)
        return undefined;
    if (!validateEntry(entry)) {
        store.delete(key);
        return undefined;
    }
    return entry.paths;
};
const trackReads = (native, dirs) => {
    const tracked = function (path, ...rest) {
        if (typeof path === 'string')
            dirs.add(path);
        return native.call(this, path, ...rest);
    };
    return tracked;
};
export const createDirTracker = () => {
    const dirs = new Set();
    return { dirs, fs: { readdir: trackReads(fs.readdir, dirs), readdirSync: trackReads(fs.readdirSync, dirs) } };
};
const stripTrailingSlash = (dir) => (dir.length > 1 && dir.endsWith('/') ? dir.slice(0, -1) : dir);
const captureDirMtimes = (dirs, baseDir) => {
    const result = {};
    const baseMtime = statDirMtime(baseDir);
    if (!Number.isNaN(baseMtime))
        result[baseDir] = baseMtime;
    for (const dir of dirs) {
        const d = stripTrailingSlash(dir);
        if (d in result)
            continue;
        const mtime = statDirMtime(d);
        if (!Number.isNaN(mtime))
            result[d] = mtime;
    }
    return result;
};
export const setCachedGlob = (key, paths, baseDir, dirs = []) => {
    store.set(key, { paths, dirMtimes: captureDirMtimes(dirs, baseDir) });
};
