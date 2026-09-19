import type { SourceMap } from '../types/config.ts';
import type { CompilerOptions } from '../types/project.ts';
interface TSConfigInfo {
    isFile: boolean;
    compilerOptions: CompilerOptions;
    fileNames: string[];
    include: string[] | undefined;
    exclude: string[] | undefined;
    sourceMapPairs: SourceMap[];
    paths: Record<string, string[]> | undefined;
}
export declare const loadTSConfig: (tsConfigFilePath: string) => Promise<TSConfigInfo>;
export {};
