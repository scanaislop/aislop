import type { InputConfigT } from '@expo/metro/metro-config';
export declare function getDefaultMetroConfig(projectRoot: string): import("expo/metro-config").MetroConfig & {
    reporter: {
        update(): void;
    };
    watchFolders: string[];
    resolver: {
        unstable_conditionsByPlatform: {
            ios: string[];
            android: string[];
            tvos: string[];
            macos: string[];
            web: string[];
        };
        resolverMainFields: string[];
        platforms: string[];
        assetExts: string[];
        sourceExts: string[];
        nodeModulesPaths: string[];
        blockList: RegExp[];
    };
    cacheStores: import("@expo/metro-config/build/binary-file-store").FileStore<any>[];
    watcher: {
        additionalExts: string[];
    };
    serializer: {
        isThirdPartyModule(module: {
            readonly path: string;
        }): boolean;
        createModuleIdFactory: () => (path: string, context?: {
            platform: string;
            environment?: string | null;
        }) => number;
        getModulesRunBeforeMainModule: () => string[];
        getPolyfills: ({ platform }: {
            platform?: null | string;
        }) => any;
    };
    server: {
        rewriteRequestUrl: (url: string) => string;
        port: number;
        unstable_serverRoot: string;
    };
    symbolicator: {
        customizeFrame: ($$PARAM_0$$: {
            readonly file?: null | string;
            readonly lineNumber?: null | number;
            readonly column?: null | number;
            readonly methodName?: null | string;
        }) => (null | undefined | {
            readonly collapse?: boolean;
        }) | Promise<null | undefined | {
            readonly collapse?: boolean;
        }>;
    };
    transformerPath: string;
    transformer: {
        unstable_workerThreads: true;
        unstable_renameRequire: false;
        _expoRouterPath: string | undefined;
        postcssHash: string | null;
        browserslistHash: string | null;
        sassVersion: string | null;
        reanimatedVersion: string | null;
        workletsVersion: string | null;
        _expoRelativeProjectRoot: string;
        unstable_allowRequireContext: true;
        allowOptionalDependencies: true;
        babelTransformerPath: string;
        asyncRequireModulePath: string;
        assetRegistryPath: string;
        enableBabelRuntime: string | undefined;
        enableBabelRCLookup: undefined;
        getTransformOptions: () => Promise<{
            transform: {
                experimentalImportSupport: true;
                inlineRequires: false;
            };
        }>;
    };
};
export declare function loadMetroUserConfigAsync(projectRoot: string, serverRoot: string): Promise<InputConfigT | null>;
