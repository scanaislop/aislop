import type { WorkspacePackage } from '../types/package-json.ts';
type WorkspaceSelectorType = 'pkg-name' | 'dir-path' | 'dir-glob';
interface ParsedSelector {
    type: WorkspaceSelectorType;
    pattern: string;
    isNegated: boolean;
}
export declare function parseWorkspaceSelector(token: string, cwd: string): ParsedSelector;
export declare function matchWorkspacesByPkgName(pattern: string, pkgNames: string[], pkgNameToWorkspaceName: Map<string, string>): string[];
export declare function matchWorkspacesByDirGlob(pattern: string, availableWorkspaceNames: string[]): string[];
export declare function selectWorkspaces(selectors: string[] | undefined, cwd: string, workspacePackages: Map<string, WorkspacePackage>, availableWorkspaceNames: string[]): Set<string> | undefined;
export {};
