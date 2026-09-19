import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
export interface DoctorMultiCheckItemBase {
    getMessage: ((packageName: string) => string) | (() => string);
    sdkVersionRange: string;
}
export declare abstract class DoctorMultiCheck<TCheckItem extends DoctorMultiCheckItemBase> implements DoctorCheck {
    abstract readonly checkItems: TCheckItem[];
    abstract description: string;
    abstract sdkVersionRange: string;
    protected abstract runAsyncInner(params: DoctorCheckParams, checkItems: TCheckItem[]): Promise<DoctorCheckResult>;
    runAsync(params: DoctorCheckParams): Promise<DoctorCheckResult>;
}
