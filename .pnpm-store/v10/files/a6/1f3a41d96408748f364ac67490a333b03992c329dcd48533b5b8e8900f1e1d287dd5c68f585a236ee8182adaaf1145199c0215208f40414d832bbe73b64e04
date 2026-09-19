import internalReporters from '../reporters/index.js';
import { _load } from './loader.js';
import { isAbsolute, isInternal, resolve } from './path.js';
export const runPreprocessors = async (processors, data) => {
    const preprocessors = await Promise.all(processors.map(proc => _load(isInternal(proc) && !isAbsolute(proc) ? resolve(proc) : proc)));
    let result = data;
    for (const preprocessor of preprocessors)
        result = await preprocessor(result);
    return result;
};
export const runReporters = async (reporter, options) => {
    const reporters = await Promise.all(reporter.map(async (reporter) => {
        return reporter in internalReporters
            ? internalReporters[reporter]
            : await _load(isInternal(reporter) && !isAbsolute(reporter) ? resolve(reporter) : reporter);
    }));
    for (const reporter of reporters)
        await reporter(options);
};
