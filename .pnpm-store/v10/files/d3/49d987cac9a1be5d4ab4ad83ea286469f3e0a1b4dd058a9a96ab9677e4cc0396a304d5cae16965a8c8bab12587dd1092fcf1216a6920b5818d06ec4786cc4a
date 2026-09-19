import type { SourceMap } from '../types/config.ts';
import type { CompilerOptions } from '../types/project.ts';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.ts';
export declare const augmentWorkspace: (workspace: Workspace, dir: string, compilerOptions: CompilerOptions | undefined, pluginSourceMaps?: SourceMap[]) => void;
export type WorkspacePackageTargetHandler = (specifier: string, filePath: string) => {
    dir: string;
    target: unknown;
    patternMatch?: string;
} | undefined;
export declare const getWorkspacePackageTargetHandler: (chief: ConfigurationChief) => WorkspacePackageTargetHandler;
export declare const getModuleSourcePathHandler: (chief: ConfigurationChief) => (filePath: string) => string | undefined;
export declare const getToSourcePathsHandler: (chief: ConfigurationChief) => (specifiers: Set<string>, dir: string, extensions: string | undefined, label: string) => Promise<string[]>;
export declare const toSourceMappedSpecifiers: (ws: Workspace | undefined, absSpecifier: string, extensions?: string) => string[];
export type ToSourceFilePath = ReturnType<typeof getModuleSourcePathHandler>;
