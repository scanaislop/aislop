import type { Workspace } from './ConfigurationChief.ts';
import type { ConfigurationHint, Counters, Issue, Issues, IssueType } from './types/issues.ts';
import type { PackageJson } from './types/package-json.ts';
import type { DependencyArray, DependencySet, HostDependencies, InstalledBinaries, WorkspaceManifests } from './types/workspace.ts';
import type { MainOptions } from './util/create-options.ts';
interface DependencyReferenceOptions {
    specifier: string;
    isDevOnly?: boolean;
    isTypeOnly?: boolean;
    isResolved?: boolean;
    isPublishedType?: boolean;
}
export declare class DependencyDeputy {
    isProduction: boolean;
    isStrict: boolean;
    isReportDependencies: boolean;
    _manifests: WorkspaceManifests;
    workspacePkgNames: Set<string>;
    referencedDependencies: Map<string, Set<string>>;
    referencedBinaries: Map<string, Set<string>>;
    hostDependencies: Map<string, HostDependencies>;
    installedBinaries: Map<string, InstalledBinaries>;
    hasTypesIncluded: Map<string, Set<string>>;
    constructor({ isProduction, isStrict, isReportDependencies }: MainOptions);
    addWorkspace({ name, dir, manifestPath, manifestStr, manifest, ignoreDependencies: id, ignoreBinaries: ib, ignoreUnresolved: iu, }: {
        name: string;
        dir: string;
        manifestPath: string;
        manifestStr: string;
        manifest: PackageJson;
        ignoreDependencies: (string | RegExp)[];
        ignoreBinaries: (string | RegExp)[];
        ignoreUnresolved: (string | RegExp)[];
    }): void;
    getWorkspaceManifest(workspaceName: string): {
        workspaceDir: string;
        manifestPath: string;
        manifestStr: string;
        dependencies: DependencyArray;
        devDependencies: DependencyArray;
        peerDependencies: DependencySet;
        optionalPeerDependencies: DependencySet;
        requiredPeerDependencies: DependencyArray;
        allDependencies: DependencySet;
        engines: Record<string, string>;
        isPrivate: boolean;
        ignoreDependencies: (string | RegExp)[];
        ignoreBinaries: (string | RegExp)[];
        ignoreUnresolved: (string | RegExp)[];
        unusedIgnoreDependencies: Set<string | RegExp>;
        unusedIgnoreBinaries: Set<string | RegExp>;
        unusedIgnoreUnresolved: Set<string | RegExp>;
    } | undefined;
    setWorkspacePkgNames(pkgNames: Iterable<string>): void;
    getProductionDependencies(workspaceName: string): DependencyArray;
    getDevDependencies(workspaceName: string): DependencyArray;
    private dependencyCache;
    getDependencies(workspaceName: string): DependencySet;
    addReferencedDependency(workspaceName: string, packageName: string): void;
    addReferencedBinary(workspaceName: string, binaryName: string): void;
    setHostDependencies(workspaceName: string, hostDependencies: HostDependencies): void;
    getHostDependenciesFor(workspaceName: string, dependency: string): {
        name: string;
        isPeerOptional: boolean;
    }[];
    getOptionalPeerDependencies(workspaceName: string): DependencySet;
    maybeAddReferencedExternalDependency(workspace: Workspace, packageName: string, { specifier, isDevOnly, isTypeOnly, isResolved, isPublishedType }: DependencyReferenceOptions): boolean;
    maybeAddReferencedBinary(workspace: Workspace, binaryName: string): Set<string> | undefined;
    private isInDependencies;
    settleDependencyIssues(): {
        dependencyIssues: Issue[];
        devDependencyIssues: Issue[];
        optionalPeerDependencyIssues: Issue[];
    };
    handleIgnoredDependencies(issues: Issues, counters: Counters, type: IssueType): void;
    handleIgnoredBinaries(issues: Issues, counters: Counters, type: IssueType): void;
    handleIgnoredUnresolved(issues: Issues, counters: Counters): void;
    removeIgnoredIssues({ issues, counters }: {
        issues: Issues;
        counters: Counters;
    }): void;
    getConfigurationHints(): ConfigurationHint[];
    addIgnoredDependencies(workspaceName: string, identifier: string): void;
    addIgnoredBinaries(workspaceName: string, identifier: string): void;
    addIgnoredUnresolved(workspaceName: string, identifier: string): void;
}
export {};
