import { type Command, type Node } from 'unbash';
export interface ScriptCommand {
    binary: string;
    args: string[];
}
export declare const toShellCommand: (argv: string[]) => string;
export declare function walkCommands(node: Node): Generator<Command>;
export declare const getScriptCommands: (script: string) => ScriptCommand[];
