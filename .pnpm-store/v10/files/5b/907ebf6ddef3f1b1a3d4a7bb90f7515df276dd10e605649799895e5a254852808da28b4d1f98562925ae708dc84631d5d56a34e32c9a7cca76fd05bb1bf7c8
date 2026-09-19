import { type RecordableHistogram } from 'node:perf_hooks';
declare class Performance {
    readonly isEnabled: boolean;
    readonly isTimerifyFunctions: boolean;
    readonly isMemoryUsageEnabled: boolean;
    readonly isDurationEnabled: boolean;
    private readonly startTime;
    private readonly memId;
    private readonly histograms;
    private readonly memEntries;
    private readonly memObserver?;
    constructor({ isTimerifyFunctions, isMemoryUsageEnabled, isDurationEnabled }: {
        isDurationEnabled?: boolean | undefined;
        isMemoryUsageEnabled?: boolean | undefined;
        isTimerifyFunctions?: boolean | undefined;
    });
    registerHistogram(name: string): RecordableHistogram;
    addMemoryMark(label: string): void;
    getTimerifiedFunctionsTable(): string;
    getMemoryUsageTable(): string;
    getCurrentDurationInMs(): number;
    getMemHeapUsage(): number;
    getCurrentMemUsageInMb(): any;
    finalize(): Promise<void>;
    reset(): void;
}
export declare const perfObserver: Performance;
export declare const timerify: <T extends (...params: any[]) => any>(fn: T, name?: string) => T;
export {};
