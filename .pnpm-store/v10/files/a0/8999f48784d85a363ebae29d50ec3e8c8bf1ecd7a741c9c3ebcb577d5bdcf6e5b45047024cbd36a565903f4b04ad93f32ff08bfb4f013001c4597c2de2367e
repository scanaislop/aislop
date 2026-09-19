import type { MainOptions } from './util/create-options.ts';
export declare class ConsoleStreamer {
    isEnabled: boolean;
    isWatch: boolean;
    private lines;
    private stdoutBaseline;
    private stderrBaseline;
    constructor(options: MainOptions);
    private clearLines;
    private clearScreen;
    private snapshot;
    private hadExternalWrites;
    private update;
    cast(message: string | string[], sub?: string): void;
    clear(): void;
}
