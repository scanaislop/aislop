import type { Gitignores } from './glob-core.ts';
export interface CachedGitignoreResult {
    ignores: Set<string>;
    unignores: Set<string>;
    gitignoreFiles: string[];
    perDirIgnores: Map<string, Gitignores>;
}
export declare const initGitignoreCache: (cacheLocation: string) => void;
export declare const isGitignoreCacheEnabled: () => boolean;
export declare const flushGitignoreCache: () => void;
export declare const getCachedGitignore: (cwd: string, workspaceDirs?: Set<string>) => CachedGitignoreResult | undefined;
export declare const setCachedGitignore: (cwd: string, workspaceDirs: Set<string> | undefined, gitignoreFiles: string[], ignores: Set<string>, unignores: Set<string>, perDirIgnores: Map<string, Gitignores>) => void;
