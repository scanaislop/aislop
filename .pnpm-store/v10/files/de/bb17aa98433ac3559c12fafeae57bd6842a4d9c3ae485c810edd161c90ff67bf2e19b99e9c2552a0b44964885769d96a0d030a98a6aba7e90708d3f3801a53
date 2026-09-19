import { ResolvedCommand } from 'package-manager-detector';
import { FormatterRunnerOptions, FormatlyReportChildProcessResult } from '../types.js';

declare function runFormatterCommand({ args, command }: ResolvedCommand, { cwd, patterns }: FormatterRunnerOptions): Promise<FormatlyReportChildProcessResult>;
declare function runPackageFormatterCommand({ args, command }: ResolvedCommand, { cwd, patterns }: FormatterRunnerOptions): Promise<FormatlyReportChildProcessResult>;

export { runFormatterCommand, runPackageFormatterCommand };
