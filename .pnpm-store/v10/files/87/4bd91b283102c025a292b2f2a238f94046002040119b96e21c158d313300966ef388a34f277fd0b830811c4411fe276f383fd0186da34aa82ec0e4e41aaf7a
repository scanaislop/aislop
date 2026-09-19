import fs from 'node:fs';
import path from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { version } from '../version.js';
import { debugLog } from './debug.js';
import { isDirectory, isFile } from './fs.js';
import { dirname } from './path.js';
export const mtimeMatches = (filePath, mtimeMs) => {
    try {
        return fs.statSync(filePath, { throwIfNoEntry: false })?.mtimeMs === mtimeMs;
    }
    catch {
        return false;
    }
};
export const createDiskCache = (name) => {
    const filename = `${name}-${version}.cache`;
    let cacheFilePath;
    let cache;
    let isDirty = false;
    return {
        init(cacheLocation) {
            cacheFilePath = path.resolve(cacheLocation, filename);
            if (isFile(cacheFilePath)) {
                try {
                    cache = deserialize(fs.readFileSync(cacheFilePath));
                }
                catch {
                    debugLog('*', `Error reading cache from ${cacheFilePath}`);
                    cache = new Map();
                }
            }
            else {
                cache = new Map();
            }
        },
        isEnabled: () => cache !== undefined,
        get: key => cache?.get(key),
        set(key, value) {
            if (!cache)
                return;
            cache.set(key, value);
            isDirty = true;
        },
        delete(key) {
            if (cache?.delete(key))
                isDirty = true;
        },
        clear() {
            if (cache && cache.size > 0) {
                cache.clear();
                isDirty = true;
            }
        },
        flush() {
            if (!cache || !cacheFilePath || !isDirty)
                return;
            try {
                const dir = dirname(cacheFilePath);
                if (!isDirectory(dir))
                    fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(cacheFilePath, serialize(cache));
                isDirty = false;
            }
            catch {
                debugLog('*', `Error writing cache to ${cacheFilePath}`);
            }
        },
    };
};
