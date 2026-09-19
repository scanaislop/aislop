import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import type { AutolinkingResolutionsCache } from '../utils/autolinkingResolutions';
type DoctorCache = AutolinkingResolutionsCache;
export declare class AutolinkingDependencyDuplicatesCheck implements DoctorCheck<DoctorCache> {
    description: string;
    sdkVersionRange: string;
    runAsync({ projectRoot, exp }: DoctorCheckParams, cache: DoctorCache): Promise<DoctorCheckResult>;
}
export {};
