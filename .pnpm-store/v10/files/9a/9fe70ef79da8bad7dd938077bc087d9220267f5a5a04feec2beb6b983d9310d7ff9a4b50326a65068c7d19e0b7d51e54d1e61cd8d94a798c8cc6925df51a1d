import type { Word } from 'unbash';
import type { BinaryResolverOptions, GetInputsFromScriptsOptions, ScriptArg } from '../types/config.ts';
import type { Input } from '../util/input.ts';
export declare const argsFrom: <T extends string | Word>(args: readonly T[], from: string) => T[];
export declare const argsAfter: <T extends string | Word>(args: readonly T[], token: string) => T[];
export declare const toWordArgs: (values: (string | number)[], words: Word[]) => ScriptArg[];
export declare const expandScript: (name: string, forwardedArgs: ScriptArg[], scripts: Record<string, string> | undefined, options: BinaryResolverOptions, opts?: Partial<GetInputsFromScriptsOptions>) => Input[] | undefined;
export declare const parseNodeArgs: (args: string[]) => import("../util/parse-args.ts").ParsedArgs;
