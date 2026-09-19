import type { MainOptions } from './util/create-options.ts';
import { type FileDescriptor } from './util/file-entry-cache.ts';
export declare class CacheConsultant<T> {
    private cache;
    getFileDescriptor: (filePath: string) => FileDescriptor<T>;
    reconcile: () => void;
    removeEntry: (filePath: string) => void;
    constructor(name: string, options: MainOptions);
    getCachedFile(filePath: string): T | undefined;
}
