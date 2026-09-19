const expansionSourceMaps = new WeakMap();
const scriptSourceMaps = new WeakMap();
export function setExpansionSourceMap(expansion, sourceMap) {
    expansionSourceMaps.set(expansion, sourceMap);
}
export function takeExpansionSourceMap(expansion) {
    const sourceMap = expansionSourceMaps.get(expansion);
    expansionSourceMaps.delete(expansion);
    return sourceMap;
}
export function setScriptSourceMap(script, sourceMap) {
    scriptSourceMaps.set(script, sourceMap);
}
/**
 * Map a decoded script's node spans into the source that contained the script.
 * Returns a map only for scripts parsed from a rebuilt string (decoded
 * escaped-backtick substitutions); `undefined` means the script's positions
 * already index the string the caller parsed — no mapping is needed.
 */
export function computeScriptSourceMap(script) {
    return scriptSourceMaps.get(script);
}
