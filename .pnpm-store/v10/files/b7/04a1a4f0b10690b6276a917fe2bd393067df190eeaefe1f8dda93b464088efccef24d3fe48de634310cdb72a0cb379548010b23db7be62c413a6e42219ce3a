declare class Env {
    /** Is running in non-interactive CI mode */
    get CI(): boolean;
    /** Enable debug logging */
    get EXPO_DEBUG(): boolean;
    /** Enable staging API environment */
    get EXPO_STAGING(): boolean;
    /** Allow disabling InstalledDependencyVersionCheck */
    get EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK(): boolean;
    /** Opt in to ReactNativeDirectoryCheck */
    get EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK(): boolean | null;
    /** If a test makes an online check and failures due to a network error, don't count it as failing the overall doctor check */
    get EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS(): boolean;
    /** EAS Build Platform */
    get EAS_BUILD_PLATFORM(): 'android' | 'ios' | null;
}
export declare const env: Env;
export {};
