import type { HostDependencies, InstalledBinaries } from '../types/workspace.ts';
type Options = {
    packageNames: string[];
    dir: string;
};
declare const getMetaDataFromPackageJson: ({ dir, packageNames }: Options) => {
    hostDependencies: HostDependencies;
    installedBinaries: InstalledBinaries;
    hasTypesIncluded: Set<string>;
};
export declare const getDependencyMetaData: typeof getMetaDataFromPackageJson;
export {};
