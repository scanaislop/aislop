import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import type { AutolinkingResolutionsCache } from '../utils/autolinkingResolutions';
import type { VersionedNativeModuleNamesCache } from '../utils/versionedNativeModules';
export declare const DEFAULT_PACKAGES_TO_IGNORE: (string | RegExp)[];
export declare function filterPackages(packages: string[], ignoredPackages: (RegExp | string)[]): string[];
type DoctorCache = AutolinkingResolutionsCache & VersionedNativeModuleNamesCache;
export declare class ReactNativeDirectoryCheck implements DoctorCheck<DoctorCache> {
    description: string;
    sdkVersionRange: string;
    runAsync({ projectRoot, pkg, exp }: DoctorCheckParams, cache: DoctorCache): Promise<DoctorCheckResult>;
}
export {};
