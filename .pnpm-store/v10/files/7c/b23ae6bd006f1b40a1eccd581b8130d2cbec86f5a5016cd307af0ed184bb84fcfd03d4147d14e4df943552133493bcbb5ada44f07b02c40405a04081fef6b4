interface GlobOptions {
    cwd: string;
    dir?: string;
    patterns: string[];
    gitignore?: boolean;
    name?: boolean;
    label?: string;
}
export declare const removeProductionSuffix: (pattern: string) => string;
export declare const prependDirToPattern: (dir: string, pattern: string) => string;
export declare const negate: (pattern: string) => string;
export declare const hasProductionSuffix: (pattern: string) => boolean;
export declare const hasNoProductionSuffix: (pattern: string) => boolean;
declare const defaultGlob: ({ cwd, dir, patterns, gitignore, label }: GlobOptions) => Promise<string[]>;
declare const syncGlob: ({ cwd, patterns }: {
    cwd: string;
    patterns: string | string[];
}) => string[];
declare const dirGlob: ({ cwd, patterns, gitignore }: GlobOptions) => Promise<string[]>;
export declare const _glob: typeof defaultGlob;
export declare const _syncGlob: typeof syncGlob;
export declare const _dirGlob: typeof dirGlob;
export {};
