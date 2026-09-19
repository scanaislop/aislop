import type { PackageJson } from '../types/package-json.ts';
declare const INDENT: unique symbol;
declare const NEWLINE: unique symbol;
interface ExtendedPackageJson extends PackageJson {
    [INDENT]?: string;
    [NEWLINE]?: string;
}
export declare const toDeclarationSpecifier: (specifier: string) => string | undefined;
export declare const getPublishedTypeManifest: (manifest: PackageJson) => {
    name?: string;
    main?: string;
    bin?: string | Record<string, string>;
    version?: string;
    private?: boolean;
    workspaces?: string[] | {
        packages?: string[];
        catalog?: import("../types/package-json.ts").Catalog;
        catalogs?: import("../types/package-json.ts").Catalogs;
    };
    exports?: string | string[] | {
        [x: string & Record<never, never>]: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        browser: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        default: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        deno: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        electron: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        import: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        node: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        "node-addons": string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        "react-native": string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        require: string | string[] | any | {
            [key: string]: string | string[] | any | any | null;
        } | null;
    } | {
        [key: string]: string | string[] | any | any | null;
    } | null;
    imports?: {
        [key: `#${string}`]: string | string[] | {
            [x: string & Record<never, never>]: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            browser: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            default: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            deno: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            electron: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            import: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            node: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            "node-addons": string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            "react-native": string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            require: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
        } | {
            [key: string]: string | string[] | any | any | null;
        } | null;
    };
    scripts?: import("../types/package-json.ts").Scripts;
    dependencies?: {
        [x: string]: string;
    };
    devDependencies?: {
        [x: string]: string;
    };
    peerDependencies?: {
        [x: string]: string;
    };
    optionalDependencies?: {
        [x: string]: string;
    };
    peerDependenciesMeta?: Record<string, {
        optional: true;
    }>;
    resolutions?: {
        [x: string]: string;
    };
    module?: string;
    browser?: string;
    types?: string;
    typings?: string;
    typesVersions?: {
        [x: string]: Record<string, string[]>;
    };
    publishConfig?: {
        directory?: string;
        main?: string;
        exports?: string | string[] | {
            [x: string & Record<never, never>]: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            browser: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            default: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            deno: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            electron: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            import: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            node: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            "node-addons": string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            "react-native": string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
            require: string | string[] | any | {
                [key: string]: string | string[] | any | any | null;
            } | null;
        } | {
            [key: string]: string | string[] | any | any | null;
        } | null;
        types?: string;
        typings?: string;
        typesVersions?: {
            [x: string]: Record<string, string[]>;
        };
    };
    catalog?: import("../types/package-json.ts").Catalog;
    catalogs?: import("../types/package-json.ts").Catalogs;
    packageManager?: string;
    engines?: Record<string, string>;
    pnpm: {
        overrides?: {
            [x: string]: string;
        };
        packageExtensions?: import("../types/package-json.ts").PackageExtensions;
    };
    knip?: import("../types/config.ts").WorkspaceConfiguration;
    angular: unknown;
    astro: unknown;
    "astro-db": unknown;
    "astro-markdoc": unknown;
    "astro-og-canvas": unknown;
    ava: unknown;
    babel: unknown;
    biome: unknown;
    borp: unknown;
    bumpp: unknown;
    bun: unknown;
    c8: unknown;
    capacitor: unknown;
    catalyst: unknown;
    changelogen: unknown;
    changelogithub: unknown;
    changesets: unknown;
    commitizen: unknown;
    commitlint: unknown;
    convex: unknown;
    "create-typescript-app": unknown;
    cspell: unknown;
    cucumber: unknown;
    cypress: unknown;
    danger: unknown;
    "dependency-cruiser": unknown;
    docusaurus: unknown;
    dotenv: unknown;
    drizzle: unknown;
    "electron-vite": unknown;
    eleventy: unknown;
    esbuild: unknown;
    eslint: unknown;
    eve: unknown;
    execa: unknown;
    expo: unknown;
    "expressive-code": unknown;
    fast: unknown;
    fumadocs: unknown;
    gatsby: unknown;
    "github-action": unknown;
    "github-actions": unknown;
    glob: unknown;
    "graphql-codegen": unknown;
    hardhat: unknown;
    husky: unknown;
    "i18next-parser": unknown;
    jest: unknown;
    karma: unknown;
    knex: unknown;
    ladle: unknown;
    "laravel-vite-plugin": unknown;
    lefthook: unknown;
    "lint-staged": unknown;
    linthtml: unknown;
    lit: unknown;
    "lockfile-lint": unknown;
    "lost-pixel": unknown;
    lunaria: unknown;
    markdownlint: unknown;
    marko: unknown;
    mdx: unknown;
    mdxlint: unknown;
    metro: unknown;
    mocha: unknown;
    moonrepo: unknown;
    msw: unknown;
    "nano-spawn": unknown;
    "nano-staged": unknown;
    nest: unknown;
    netlify: unknown;
    next: unknown;
    "next-intl": unknown;
    "next-mdx": unknown;
    nitro: unknown;
    node: unknown;
    "node-modules-inspector": unknown;
    nodemon: unknown;
    "npm-package-json-lint": unknown;
    nuxt: unknown;
    "nuxtjs-i18n": unknown;
    nx: unknown;
    nyc: unknown;
    oclif: unknown;
    "openapi-ts": unknown;
    openclaw: unknown;
    orval: unknown;
    oxfmt: unknown;
    oxlint: unknown;
    "panda-css": unknown;
    parcel: unknown;
    payload: unknown;
    pino: unknown;
    playwright: unknown;
    "playwright-ct": unknown;
    "playwright-test": unknown;
    plop: unknown;
    pm2: unknown;
    postcss: unknown;
    "pre-commit": unknown;
    preconstruct: unknown;
    prettier: unknown;
    prisma: unknown;
    quasar: unknown;
    qwik: unknown;
    raycast: unknown;
    "react-cosmos": unknown;
    "react-email": unknown;
    "react-native": unknown;
    "react-router": unknown;
    relay: unknown;
    "release-it": unknown;
    remark: unknown;
    remix: unknown;
    rolldown: unknown;
    rollup: unknown;
    rsbuild: unknown;
    rslib: unknown;
    rspack: unknown;
    rstest: unknown;
    sanity: unknown;
    "semantic-release": unknown;
    sentry: unknown;
    "serverless-framework": unknown;
    "simple-git-hooks": unknown;
    "size-limit": unknown;
    sst: unknown;
    starlight: unknown;
    stencil: unknown;
    storybook: unknown;
    stryker: unknown;
    stylelint: unknown;
    svelte: unknown;
    "sveltejs-package": unknown;
    sveltekit: unknown;
    svgo: unknown;
    svgr: unknown;
    swc: unknown;
    syncpack: unknown;
    tailwind: unknown;
    "tanstack-router": unknown;
    taskfile: unknown;
    tauri: unknown;
    temporal: unknown;
    travis: unknown;
    "ts-node": unknown;
    tsd: unknown;
    tsdown: unknown;
    tsup: unknown;
    tsx: unknown;
    typedoc: unknown;
    typescript: unknown;
    unbuild: unknown;
    unocss: unknown;
    "unplugin-auto-import": unknown;
    "unplugin-icons": unknown;
    "unplugin-vue-components": unknown;
    "unplugin-vue-i18n": unknown;
    "unplugin-vue-markdown": unknown;
    "unplugin-vue-router": unknown;
    vercel: unknown;
    "vercel-og": unknown;
    vike: unknown;
    vite: unknown;
    "vite-plugin-pages": unknown;
    "vite-plugin-pwa": unknown;
    "vite-plugin-vue-layouts-next": unknown;
    "vite-plus": unknown;
    "vite-pwa-assets-generator": unknown;
    vitepress: unknown;
    vitest: unknown;
    vue: unknown;
    "webdriver-io": unknown;
    webpack: unknown;
    wireit: unknown;
    wrangler: unknown;
    wxt: unknown;
    xo: unknown;
    yarn: unknown;
    yorkie: unknown;
    zx: unknown;
};
export declare const getPublishedTypeExportSpecifiers: (exports: PackageJson['exports']) => Set<string>;
export declare const getPublishedTypeEntrySpecifiers: (manifest: PackageJson) => {
    candidates: string[];
    versioned: Set<string>;
};
export declare const getPackageMapTarget: (map: unknown, key: string) => {
    target: any;
    patternMatch?: undefined;
} | {
    target: unknown;
    patternMatch: string;
} | undefined;
export declare const isPublishedTypeExportTarget: (exports: PackageJson['exports'], candidate: string) => boolean;
export declare const load: (filePath: string) => Promise<ExtendedPackageJson>;
export declare const save: (filePath: string, content: ExtendedPackageJson) => Promise<void>;
export declare const getEntrySpecifiersFromManifest: (manifest: PackageJson) => Set<string>;
export type Manifest = PackageJson & {
    scriptNames: Set<string>;
    getMajor: (name: string) => number | undefined;
};
export declare const createManifest: (raw: PackageJson) => Manifest;
export declare const getManifestImportDependencies: (manifest: PackageJson) => Set<string>;
export {};
