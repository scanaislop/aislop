import type { ParsedScript, ScriptSourceMap } from "./types.ts";
export declare function setExpansionSourceMap(expansion: object, sourceMap: ScriptSourceMap): void;
export declare function takeExpansionSourceMap(expansion: object): ScriptSourceMap | undefined;
export declare function setScriptSourceMap(script: ParsedScript, sourceMap: ScriptSourceMap): void;
/**
 * Map a decoded script's node spans into the source that contained the script.
 * Returns a map only for scripts parsed from a rebuilt string (decoded
 * escaped-backtick substitutions); `undefined` means the script's positions
 * already index the string the caller parsed — no mapping is needed.
 */
export declare function computeScriptSourceMap(script: ParsedScript): ScriptSourceMap | undefined;
