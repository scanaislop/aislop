export declare const mtimeMatches: (filePath: string, mtimeMs: number) => boolean;
export interface DiskCache<V> {
    init: (cacheLocation: string) => void;
    isEnabled: () => boolean;
    get: (key: string) => V | undefined;
    set: (key: string, value: V) => void;
    delete: (key: string) => void;
    clear: () => void;
    flush: () => void;
}
export declare const createDiskCache: <V>(name: string) => DiskCache<V>;
