import type { Workspace } from '../ConfigurationChief.ts';
import type { PackageJson } from '../types/package-json.ts';
interface PublishedTypeDependency {
    containingFilePath: string;
    packageName: string;
    specifier: string;
    pos: number;
    line: number;
    col: number;
    isResolved: boolean;
}
export declare const createPublishedTypeDependencyAnalyzer: () => (workspace: Workspace, manifest: PackageJson) => PublishedTypeDependency[];
export {};
