import { core } from 'zod/mini';
interface ErrorWithCause extends Error {
    cause: Error;
}
export declare class ConfigurationError extends Error {
}
export declare class LoaderError extends Error {
}
export declare const isKnownError: (error: Error) => error is core.$ZodError<any> | ConfigurationError | LoaderError;
export declare const hasErrorCause: (error: Error) => error is ErrorWithCause;
export declare const isConfigurationError: (error: Error) => error is ConfigurationError;
export declare const isModuleNotFoundError: (error: Error) => boolean;
export declare const isLoaderError: (error: Error) => error is LoaderError;
export declare const formatCauseMessage: (error: Error, cwd: string) => string;
export declare const getKnownErrors: (error: Error) => Error[];
export {};
