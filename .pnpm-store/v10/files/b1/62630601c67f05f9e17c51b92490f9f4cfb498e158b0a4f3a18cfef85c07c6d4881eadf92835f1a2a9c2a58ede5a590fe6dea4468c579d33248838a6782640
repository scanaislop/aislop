interface FormatlyOptions extends ResolveFormatterOptions {
    cwd?: string;
    /**
     * Pass an explicitly formatter to use instead of automatically detecting
     */
    formatter?: FormatterName;
}
type FormatlyReport = FormatlyReportError | FormatlyReportResult;
interface FormatlyReportChildProcessResult {
    code: null | number;
    runner: "child_process";
    signal: NodeJS.Signals | null;
}
interface FormatlyReportError {
    message: string;
    ran: false;
}
interface FormatlyReportResult {
    formatter: Formatter;
    ran: true;
    result: FormatlyReportChildProcessResult | FormatlyReportVirtualResult;
}
interface FormatlyReportVirtualResult {
    runner: "virtual";
}
interface Formatter {
    name: FormatterName;
    runner: FormatterRunner;
    testers: {
        configFile: RegExp;
        packageKey?: string;
        script: RegExp;
    };
}
type FormatterName = "biome" | "deno" | "dprint" | "oxfmt" | "prettier";
type FormatterRunner = (options: FormatterRunnerOptions) => Promise<FormatlyReportChildProcessResult | FormatlyReportVirtualResult>;
interface FormatterRunnerOptions {
    cwd: string;
    patterns: string[];
}
interface ResolveFormatterOptions {
    /**
     * Formatter names to detect in order, before any formatters not listed.
     * Unlisted formatters are then detected in their default order.
     */
    order?: FormatterName[];
    /**
     * Directory to stop searching parent directories for a config file at.
     * If not provided, only the working directory is searched.
     */
    stopDirectory?: StopDirectory;
}
type StopDirectory = ((currentDirectory: string) => boolean) | string;

export type { FormatlyOptions, FormatlyReport, FormatlyReportChildProcessResult, FormatlyReportError, FormatlyReportResult, FormatlyReportVirtualResult, Formatter, FormatterName, FormatterRunner, FormatterRunnerOptions, ResolveFormatterOptions, StopDirectory };
