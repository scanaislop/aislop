import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import type { VersionedNativeModuleNamesCache } from '../utils/versionedNativeModules';
type DoctorCache = VersionedNativeModuleNamesCache;
export declare class PeerDependencyChecks implements DoctorCheck<DoctorCache> {
    description: string;
    sdkVersionRange: string;
    runAsync({ pkg, projectRoot, exp }: DoctorCheckParams, cache: DoctorCache): Promise<DoctorCheckResult>;
    private checkPackagePeerDependencies;
}
export {};
