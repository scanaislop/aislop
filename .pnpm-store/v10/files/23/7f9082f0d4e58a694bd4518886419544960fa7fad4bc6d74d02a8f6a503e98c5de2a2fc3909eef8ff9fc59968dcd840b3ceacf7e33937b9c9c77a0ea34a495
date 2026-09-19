import { debugLogObject } from './debug.js';
import { ConfigurationError } from './errors.js';
import { _load } from './loader.js';
const unwrapFunction = async (maybeFunction, options) => {
    if (typeof maybeFunction === 'function') {
        try {
            return await maybeFunction(options);
        }
        catch (error) {
            debugLogObject('*', 'Error executing function:', error);
            throw error;
        }
    }
    return maybeFunction;
};
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
export async function loadResolvedConfigFile(configPath, options) {
    const loadedValue = await _load(configPath);
    let config;
    try {
        config = await unwrapFunction(loadedValue, options);
    }
    catch (_error) {
        throw new ConfigurationError(`Error running the function from ${configPath}`);
    }
    if (!isObject(config))
        throw new ConfigurationError(`Expected an object as configuration from ${configPath}`);
    return config;
}
