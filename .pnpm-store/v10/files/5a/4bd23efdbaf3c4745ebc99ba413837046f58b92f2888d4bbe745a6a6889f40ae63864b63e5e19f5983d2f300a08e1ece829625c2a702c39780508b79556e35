import type { ExpoConfig, PackageJSONConfig } from '@expo/config';
/**
 * Get the doctor config from the package.json.
 * The config is optional, and defaults to false for enabled and true for listUnknownPackages.
 *
 * Example config:
 *
 * ```json
 * {
 *  "expo": {
 *    "doctor": {
 *      "reactNativeDirectoryCheck": {
 *        "enabled": true,
 *        "exclude": ["/foo/", "bar"]
 *        "listUnknownPackages": true,
 *      },
 *      "appConfigFieldsNotSyncedCheck": {
 *        "enabled": false
 *      },
 *    }
 *  }
 * ```
 **/
interface DoctorPackageJsonConfig {
    reactNativeDirectoryCheck?: {
        enabled?: boolean;
        exclude?: string[];
        listUnknownPackages?: boolean;
    };
    appConfigFieldsNotSyncedCheck?: {
        enabled?: boolean;
    };
}
export declare function getDoctorConfig(pkg: any): DoctorPackageJsonConfig;
export declare function getReactNativeDirectoryCheckExcludes(pkg: any): (string | RegExp)[];
export declare function getReactNativeDirectoryCheckEnabled(exp: ExpoConfig, pkg: PackageJSONConfig): boolean;
export declare function getReactNativeDirectoryCheckListUnknownPackagesEnabled(pkg: any): boolean | null;
/**
 * Get status of appConfigFieldsNotSyncedCheck check
 * @param pkg package.json
 * @returns true if the check is enabled, false otherwise
 */
export declare function getAppConfigFieldsNotSyncedCheckStatus(pkg: any): boolean;
export {};
