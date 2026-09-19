import type { Configuration, IgnoreIssues, IgnorePatterns, RawConfiguration, SourceMap, WorkspaceConfiguration } from './types/config.ts';
import type { ConfigurationHint } from './types/issues.ts';
import type { WorkspacePackage } from './types/package-json.ts';
import type { MainOptions } from './util/create-options.ts';
import { type WorkspaceGraph } from './util/create-workspace-graph.ts';
import { type WorkspaceFilePathFilter } from './util/workspace-file-filter.ts';
export declare const isDefaultPattern: (type: 'entry' | 'project', id: string) => boolean;
export type Workspace = {
    name: string;
    pkgName: string;
    dir: string;
    ancestors: string[];
    config: WorkspaceConfiguration;
    manifestPath: string;
    manifestStr: string;
    ignoreMembers: IgnorePatterns;
    sourceMaps?: SourceMap[];
};
export declare class ConfigurationChief {
    cwd: string;
    rawConfig?: RawConfiguration;
    isProduction: boolean;
    isStrict: boolean;
    isIncludeEntryExports: boolean;
    config: Configuration;
    workspace: string | string[] | undefined;
    selectedWorkspaces: Set<string> | undefined;
    workspaceFilePathFilter: WorkspaceFilePathFilter;
    workspaces: string[];
    ignoredWorkspacePatterns: string[];
    workspacePackages: Map<string, WorkspacePackage>;
    workspacesByPkgName: Map<string, Workspace>;
    workspacesByDir: Map<string, Workspace>;
    additionalWorkspaceNames: Set<string>;
    availableWorkspaceNames: string[];
    availableWorkspacePkgNames: Set<string>;
    availableWorkspaceDirs: string[];
    private availableWorkspaceDirsWithSlash;
    workspaceGraph: WorkspaceGraph;
    private workspaceByFileCache;
    constructor(options: MainOptions);
    getConfigurationHints(): ConfigurationHint[];
    private normalize;
    getWorkspaces(): Promise<Workspace[]>;
    private getListedWorkspaces;
    private getIgnoredWorkspaces;
    private getIgnoredWorkspacePatterns;
    private getConfiguredWorkspaceKeys;
    private getAdditionalWorkspaceNames;
    private getAvailableWorkspaceNames;
    private getIncludedWorkspaces;
    getManifestForWorkspace(name: string): import("./types/package-json.ts").PackageJson | undefined;
    private getDescendentWorkspaces;
    getIgnoredWorkspacesFor(name: string): string[];
    createIgnoredWorkspaceMatcher(name: string, dir: string): (filePath: string) => boolean;
    getNegatedWorkspacePatterns(name: string): string[];
    private getConfigKeyForWorkspace;
    private getSelectedWorkspaces;
    getWorkspaceConfig(workspaceName: string): {
        angular?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        astro?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'astro-db'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'astro-markdoc'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'astro-og-canvas'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        ava?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        babel?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        biome?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        borp?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        bumpp?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        bun?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        c8?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        capacitor?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        catalyst?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        changelogen?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        changelogithub?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        changesets?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        commitizen?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        commitlint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        convex?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'create-typescript-app'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        cspell?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        cucumber?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        cypress?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        danger?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'dependency-cruiser'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        docusaurus?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        dotenv?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        drizzle?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'electron-vite'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        eleventy?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        esbuild?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        eslint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        eve?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        execa?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        expo?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'expressive-code'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        fast?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        fumadocs?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        gatsby?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'github-action'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'github-actions'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        glob?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'graphql-codegen'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        hardhat?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        husky?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'i18next-parser'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        jest?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        karma?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        knex?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        ladle?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'laravel-vite-plugin'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        lefthook?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'lint-staged'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        linthtml?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        lit?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'lockfile-lint'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'lost-pixel'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        lunaria?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        markdownlint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        marko?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        mdx?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        mdxlint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        metro?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        mocha?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        moonrepo?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        msw?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'nano-spawn'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'nano-staged'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nest?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        netlify?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        next?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'next-intl'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'next-mdx'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nitro?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        node?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'node-modules-inspector'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nodemon?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'npm-package-json-lint'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nuxt?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'nuxtjs-i18n'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nx?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        nyc?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        oclif?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'openapi-ts'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        openclaw?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        orval?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        oxfmt?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        oxlint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'panda-css'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        parcel?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        payload?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        pino?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        playwright?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'playwright-ct'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'playwright-test'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        plop?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        pm2?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        pnpm?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        postcss?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'pre-commit'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        preconstruct?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        prettier?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        prisma?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        quasar?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        qwik?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        raycast?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'react-cosmos'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'react-email'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'react-native'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'react-router'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        relay?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'release-it'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        remark?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        remix?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rolldown?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rollup?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rsbuild?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rslib?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rspack?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        rstest?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        sanity?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'semantic-release'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        sentry?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'serverless-framework'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'simple-git-hooks'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'size-limit'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        sst?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        starlight?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        stencil?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        storybook?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        stryker?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        stylelint?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        svelte?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'sveltejs-package'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        sveltekit?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        svgo?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        svgr?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        swc?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        syncpack?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tailwind?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'tanstack-router'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        taskfile?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tauri?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        temporal?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        travis?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'ts-node'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tsd?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tsdown?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tsup?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        tsx?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        typedoc?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        typescript?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        unbuild?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        unocss?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'unplugin-auto-import'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'unplugin-icons'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'unplugin-vue-components'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'unplugin-vue-i18n'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'unplugin-vue-markdown'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'unplugin-vue-router'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vercel?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'vercel-og'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vike?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vite?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'vite-plugin-pages'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'vite-plugin-pwa'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'vite-plugin-vue-layouts-next'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'vite-plus'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'vite-pwa-assets-generator'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vitepress?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vitest?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        vue?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        'webdriver-io'?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        webpack?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        wireit?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        wrangler?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        wxt?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        xo?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        yarn?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        yorkie?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        zx?: string | boolean | string[] | {
            config?: string | string[] | undefined;
            entry?: string | string[] | undefined;
            project?: string | string[] | undefined;
        } | undefined;
        entry?: string | string[] | undefined;
        project?: string | string[] | undefined;
        paths?: Record<string, string[]> | undefined;
        ignore?: string | string[] | undefined;
        ignoreFiles?: string | string[] | undefined;
        ignoreBinaries?: (string | RegExp)[] | undefined;
        ignoreDependencies?: (string | RegExp)[] | undefined;
        ignoreMembers?: (string | RegExp)[] | undefined;
        ignoreUnresolved?: (string | RegExp)[] | undefined;
        ignoreExportsUsedInFile?: boolean | Record<string, boolean | undefined> | undefined;
        ignoreIssues?: Record<string, ("binaries" | "catalog" | "catalogReferences" | "cycles" | "dependencies" | "devDependencies" | "duplicates" | "enumMembers" | "exports" | "files" | "namespaceMembers" | "nsExports" | "nsTypes" | "optionalPeerDependencies" | "types" | "unlisted" | "unresolved")[]> | undefined;
        includeEntryExports?: boolean | undefined;
    };
    getIgnores(workspaceName: string): {
        ignoreBinaries: (string | RegExp)[];
        ignoreDependencies: (string | RegExp)[];
        ignoreUnresolved: (string | RegExp)[];
    };
    getIgnoreIssues(): IgnoreIssues;
    getConfigForWorkspace(workspaceName: string, extensions?: string[]): {
        entry: string[];
        project: string[];
        paths: Record<string, string[]>;
        ignore: string[];
        ignoreFiles: string[];
        ignoreExportsUsedInFile: Record<string, boolean | undefined> | import("./types/config.ts").IgnoreExportsUsedInFile;
        isIncludeEntryExports: boolean;
        angular?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        astro?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "astro-db"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "astro-markdoc"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "astro-og-canvas"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        ava?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        babel?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        biome?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        borp?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        bumpp?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        bun?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        c8?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        capacitor?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        catalyst?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        changelogen?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        changelogithub?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        changesets?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        commitizen?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        commitlint?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        convex?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "create-typescript-app"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        cspell?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        cucumber?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        cypress?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        danger?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "dependency-cruiser"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        docusaurus?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        dotenv?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        drizzle?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "electron-vite"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        eleventy?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        esbuild?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        eslint?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        eve?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        execa?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        expo?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "expressive-code"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        fast?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        fumadocs?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        gatsby?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "github-action"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "github-actions"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        glob?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "graphql-codegen"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        hardhat?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        husky?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "i18next-parser"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        jest?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        karma?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        knex?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        ladle?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "laravel-vite-plugin"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        lefthook?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "lint-staged"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        linthtml?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        lit?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "lockfile-lint"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "lost-pixel"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        lunaria?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        markdownlint?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        marko?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        mdx?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        mdxlint?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        metro?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        mocha?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        moonrepo?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        msw?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "nano-spawn"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "nano-staged"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        nest?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        netlify?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        next?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "next-intl"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "next-mdx"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        nitro?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        node?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "node-modules-inspector"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        nodemon?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "npm-package-json-lint"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        nuxt?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "nuxtjs-i18n"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        nx?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        nyc?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        oclif?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "openapi-ts"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        openclaw?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        orval?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        oxfmt?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        oxlint?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "panda-css"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        parcel?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        payload?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        pino?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        playwright?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "playwright-ct"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "playwright-test"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        plop?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        pm2?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        pnpm?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        postcss?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "pre-commit"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        preconstruct?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        prettier?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        prisma?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        quasar?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        qwik?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        raycast?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "react-cosmos"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "react-email"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "react-native"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "react-router"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        relay?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "release-it"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        remark?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        remix?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        rolldown?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        rollup?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        rsbuild?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        rslib?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        rspack?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        rstest?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        sanity?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "semantic-release"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        sentry?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "serverless-framework"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "simple-git-hooks"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "size-limit"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        sst?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        starlight?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        stencil?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        storybook?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        stryker?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        stylelint?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        svelte?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "sveltejs-package"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        sveltekit?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        svgo?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        svgr?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        swc?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        syncpack?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        tailwind?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "tanstack-router"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        taskfile?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        tauri?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        temporal?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        travis?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "ts-node"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        tsd?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        tsdown?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        tsup?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        tsx?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        typedoc?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        typescript?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        unbuild?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        unocss?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "unplugin-auto-import"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "unplugin-icons"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "unplugin-vue-components"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "unplugin-vue-i18n"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "unplugin-vue-markdown"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "unplugin-vue-router"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        vercel?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "vercel-og"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        vike?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        vite?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "vite-plugin-pages"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "vite-plugin-pwa"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "vite-plugin-vue-layouts-next"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "vite-plus"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "vite-pwa-assets-generator"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        vitepress?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        vitest?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        vue?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        "webdriver-io"?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        webpack?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        wireit?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        wrangler?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        wxt?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        xo?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        yarn?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        yorkie?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
        zx?: (boolean | import("./types/config.ts").EnsuredPluginConfiguration) | undefined;
    };
    findWorkspaceByFilePath(filePath: string): Workspace | undefined;
    getUnusedIgnoredWorkspaces(): string[];
    getUnusedConfiguredWorkspaces(): string[];
}
