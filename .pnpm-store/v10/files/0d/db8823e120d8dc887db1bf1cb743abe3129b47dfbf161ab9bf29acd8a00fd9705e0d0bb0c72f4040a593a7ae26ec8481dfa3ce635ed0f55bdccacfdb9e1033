import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
export declare const PLAY_STORE_MINIMUM_REQS: {
    effectiveDate: string;
    AndroidSdkVersion: number;
    ExpoSdkVersion: number;
};
export declare class StoreCompatibilityCheck implements DoctorCheck {
    description: string;
    sdkVersionRange: string;
    runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult>;
}
