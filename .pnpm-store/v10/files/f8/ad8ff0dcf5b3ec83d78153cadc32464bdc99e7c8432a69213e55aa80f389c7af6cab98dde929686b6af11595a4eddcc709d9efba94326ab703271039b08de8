import type { ExpoConfig, PackageJSONConfig } from '@expo/config';
export interface DoctorCheck<CacheType extends {
    [prop: string]: any;
} = {
    [prop: string]: any;
}> {
    description: string;
    sdkVersionRange: string;
    runAsync(params: DoctorCheckParams, cache: CacheType): Promise<DoctorCheckResult>;
}
export interface DoctorCheckResult {
    isSuccessful: boolean;
    /** many checks currently output their own issues, no need to duplicate */
    issues: string[];
    advice: string[];
}
export interface DoctorCheckParams {
    projectRoot: string;
    exp: ExpoConfig;
    pkg: PackageJSONConfig;
    hasUnusedStaticConfig: boolean;
    staticConfigPath: string | null;
    dynamicConfigPath: string | null;
}
