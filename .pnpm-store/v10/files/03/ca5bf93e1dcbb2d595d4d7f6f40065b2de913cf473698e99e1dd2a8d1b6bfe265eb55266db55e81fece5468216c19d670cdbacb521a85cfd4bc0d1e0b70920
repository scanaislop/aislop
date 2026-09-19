import type { AsyncCompilers, SyncCompilers } from '../compilers/types.ts';
interface SourceFileManagerOptions {
    compilers: [SyncCompilers, AsyncCompilers];
}
export declare class SourceFileManager {
    sourceTextCache: Map<string, string>;
    syncCompilers: SyncCompilers;
    asyncCompilers: AsyncCompilers;
    constructor({ compilers }: SourceFileManagerOptions);
    readFile(filePath: string): string;
    invalidate(filePath: string): void;
    compileAndAddSourceFile(filePath: string): Promise<void>;
    private readRawFile;
}
export {};
