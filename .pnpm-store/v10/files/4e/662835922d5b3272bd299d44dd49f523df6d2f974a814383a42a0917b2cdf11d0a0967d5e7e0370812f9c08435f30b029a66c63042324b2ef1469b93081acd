import type { FSLike } from 'fdir';
export declare const initGlobCache: (cacheLocation: string) => void;
export declare const isGlobCacheEnabled: () => boolean;
export declare const flushGlobCache: () => void;
export declare const clearGlobCache: () => void;
export declare const computeGlobCacheKey: (input: {
    patterns: string[];
    cwd: string;
    dir: string;
    gitignore: boolean;
    gitignoreFingerprint: string;
}) => string;
export declare const getCachedGlob: (key: string) => string[] | undefined;
export declare const createDirTracker: () => {
    dirs: Set<string>;
    fs: Partial<FSLike>;
};
export declare const setCachedGlob: (key: string, paths: string[], baseDir: string, dirs?: Iterable<string>) => void;
