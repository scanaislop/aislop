import { SCRIPT_INTERPOLATION } from '../constants.js';
import { fromBinary, isBinary, isDependency } from '../util/input.js';
import { timerify } from '../util/Performance.js';
import { getDependenciesFromScript } from './bash-parser.js';
const getInputsFromScripts = (npmScripts, options) => {
    const scripts = typeof npmScripts === 'string' ? [npmScripts] : Array.from(npmScripts);
    const results = scripts.flatMap(script => getDependenciesFromScript(script, options));
    const inputs = new Set();
    for (const input of results) {
        if (!input.specifier)
            continue;
        if (input.specifier.includes(SCRIPT_INTERPOLATION))
            continue;
        if (isDependency(input) && input.specifier.startsWith('http'))
            continue;
        if (isBinary(input) && !/^\b/.test(fromBinary(input)))
            continue;
        inputs.add(input);
    }
    return Array.from(inputs);
};
export const _getInputsFromScripts = timerify(getInputsFromScripts);
