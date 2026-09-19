import type { DoctorMultiCheckItemBase } from './DoctorMultiCheck';
import { DoctorMultiCheck } from './DoctorMultiCheck';
import type { DoctorCheckParams, DoctorCheckResult } from './checks.types';
export type DirectPackageInstallCheckItem = {
    packageName: string;
} & DoctorMultiCheckItemBase;
export declare const directPackageInstallCheckItems: DirectPackageInstallCheckItem[];
export declare class DirectPackageInstallCheck extends DoctorMultiCheck<DirectPackageInstallCheckItem> {
    description: string;
    sdkVersionRange: string;
    checkItems: DirectPackageInstallCheckItem[];
    protected runAsyncInner({ pkg }: DoctorCheckParams, checkItems: DirectPackageInstallCheckItem[]): Promise<DoctorCheckResult>;
}
