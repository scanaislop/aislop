import type { Word } from 'unbash';
type ParsedValue = any;
export interface ParsedArgs {
    _: string[];
    '--'?: string[];
    [key: string]: ParsedValue;
}
interface Opts {
    string?: string[];
    boolean?: string[];
    alias?: Record<string, string | string[]>;
    '--'?: boolean;
}
declare const parseArgs: (input: readonly (string | Word)[], opts?: Opts) => ParsedArgs;
export default parseArgs;
