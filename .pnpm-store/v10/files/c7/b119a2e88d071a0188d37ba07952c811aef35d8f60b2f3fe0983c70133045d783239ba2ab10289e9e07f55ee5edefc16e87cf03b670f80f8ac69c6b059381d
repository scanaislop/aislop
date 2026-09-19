import { basename, dirname } from '../util/path.js';
const isAlias = (s) => (s.charCodeAt(0) === 64 && s.charCodeAt(1) === 47) || s.charCodeAt(0) === 126 || s.charCodeAt(0) === 35;
export const isScopedPackage = (s) => s.charCodeAt(0) === 64 && s.charCodeAt(1) !== 47;
export const isTildePackage = (s) => s.charCodeAt(0) === 126 && s.charCodeAt(1) !== 47;
export const ensureRelative = (spec) => (spec.startsWith('.') || isAlias(spec) ? spec : `./${spec}`);
export const splitSpec = (specifier) => {
    const spec = ensureRelative(specifier);
    return { dir: dirname(spec), name: basename(spec) };
};
