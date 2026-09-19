type MetaData<T> = {
    size: number;
    mtime: number;
    data?: T;
};
export type FileDescriptor<T> = {
    key: string;
    changed?: boolean;
    notFound?: boolean;
    err?: unknown;
    meta?: MetaData<T>;
};
export declare class FileEntryCache<T> {
    filePath: string;
    cache: Map<string, MetaData<T>>;
    normalizedEntries: Map<string, FileDescriptor<T>>;
    constructor(cacheId: string, _path: string);
    getFileDescriptor(filePath: string): FileDescriptor<T>;
    removeEntry(entryName: string): void;
    reconcile(): void;
}
export {};
