import type { ToSourceFilePath, WorkspacePackageTargetHandler } from '../util/to-source-path.ts';
import type { ResolveModule } from './ast-nodes.ts';
type ScopedPaths = Array<{
    scope: string;
    paths: Record<string, string[]>;
}>;
type ScopedRootDirs = Array<{
    scope: string;
    rootDirs: string[];
}>;
export declare function clearModuleResolutionCaches(): void;
export type ResolveGlobPattern = (pattern: string, dir: string) => string[];
export declare function createGlobAliasResolver(scopedPaths: ScopedPaths | undefined): ResolveGlobPattern;
export declare function createCustomModuleResolver(compilerOptions: {
    scopedPaths?: ScopedPaths;
    scopedRootDirs?: ScopedRootDirs;
}, customCompilerExtensions: string[], toSourceFilePath: ToSourceFilePath, findWorkspacePackageTarget?: WorkspacePackageTargetHandler, tsConfigFile?: string): ResolveModule;
export {};
