import { core } from 'zod/mini';
import { substringBefore } from './string.js';
const isZodErrorLike = (error) => error instanceof core.$ZodError;
export class ConfigurationError extends Error {
}
export class LoaderError extends Error {
}
export const isKnownError = (error) => error instanceof ConfigurationError || error instanceof LoaderError || isZodErrorLike(error);
export const hasErrorCause = (error) => !isZodErrorLike(error) && error.cause instanceof Error;
export const isConfigurationError = (error) => error instanceof ConfigurationError;
export const isModuleNotFoundError = (error) => 'code' in error && error.code === 'MODULE_NOT_FOUND';
export const isLoaderError = (error) => error instanceof LoaderError;
export const formatCauseMessage = (error, cwd) => {
    let root = error;
    while (root.cause instanceof Error)
        root = root.cause;
    return substringBefore(root.message, '\n').replace(`${cwd}/`, '');
};
export const getKnownErrors = (error) => {
    if (isZodErrorLike(error))
        return Array.from(error.issues, error => {
            let message = error.message;
            const details = [];
            if (error.path.length > 0)
                details.push(`location: ${error.path.join('.')}`);
            if (typeof error.expected === 'string')
                details.push(`expected: ${error.expected}`);
            if (Array.isArray(error.keys))
                details.push(`${error.code}: ${error.keys.join(', ')}`);
            if (details.length > 0)
                message += ` (${details.join(', ')})`;
            return new Error(message);
        });
    return [error];
};
