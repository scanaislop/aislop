import { type GlobOptions as TinyGlobOptions } from 'tinyglobby';
type Options = {
    gitignore: boolean;
    cwd: string;
};
interface GlobOptions extends TinyGlobOptions {
    gitignore: boolean;
    cwd: string;
    dir: string;
    label?: string;
}
export type Gitignores = {
    ignores: Set<string>;
    unignores: Set<string>;
};
export declare const getGitignoreFingerprint: () => string;
export declare const findAndParseGitignores: (cwd: string, workspaceDirs?: Set<string>) => Promise<{
    gitignoreFiles: string[];
    ignores: Set<string>;
    unignores: Set<string>;
}>;
export declare function glob(_patterns: string[], options: GlobOptions): Promise<string[]>;
export declare function reconcileGitignoredPaths(paths: string[], cwd: string): string[];
export declare function getGitIgnoredHandler(options: Options, workspaceDirs?: Set<string>): Promise<(path: string) => boolean>;
export {};
