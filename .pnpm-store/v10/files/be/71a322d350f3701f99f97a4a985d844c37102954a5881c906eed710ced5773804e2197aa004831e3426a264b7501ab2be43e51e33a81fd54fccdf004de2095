export type ReactNativeDirectoryCheckResult = {
    unmaintained?: boolean;
    newArchitecture: 'supported' | 'unsupported' | 'untested' | 'new-arch-only';
};
export type DirectoryCheckResponse = Record<string, ReactNativeDirectoryCheckResult>;
export declare const checkLibraries: (packageNames: string[]) => Promise<DirectoryCheckResponse | null>;
export declare function chunk<T>(array: T[], size: number): T[][];
