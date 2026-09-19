import type { DependencyResolution } from 'expo-modules-autolinking/exports';
import type { VersionedNativeModuleNamesCache } from './versionedNativeModules';
export declare function importAutolinkingExportsFromProject(projectDir: string): typeof import('expo/internal/unstable-autolinking-exports');
export declare class ExpoExportMissingError extends Error {
}
export interface AutolinkingResolutionsCache extends VersionedNativeModuleNamesCache {
    resolutions?: Promise<Map<string, DependencyResolution>>;
}
export declare const scanNativeModuleResolutions: (cache: AutolinkingResolutionsCache, params: {
    projectRoot: string;
    sdkVersion: string | undefined;
}) => Promise<Map<string, DependencyResolution>>;
