import MDX from '../../compilers/mdx.js';
import { toConfig, toDeferResolve, toDependency, toEntry } from '../../util/input.js';
import { join, relative } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getBabelInputs } from '../vite/helpers.js';
const title = 'Storybook';
const enablers = [/^@storybook\//, '@nrwl/storybook'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.{storybook,rnstorybook}/{main,test-runner}.{js,ts,mts}'];
const stories = ['**/*.@(mdx|stories.@(mdx|js|jsx|mjs|ts|tsx))'];
const restEntry = ['.{storybook,rnstorybook}/{manager,preview,index,vitest.setup}.{js,jsx,ts,tsx}'];
const entry = [...restEntry, ...stories];
const project = ['.{storybook,rnstorybook}/**/*.{js,jsx,ts,tsx,mts}'];
const resolveConfig = async (localConfig, options) => {
    const { cwd, configFileDir, configFilePath } = options;
    const strs = typeof localConfig?.stories === 'function' ? await localConfig.stories(stories) : localConfig?.stories;
    const relativePatterns = strs?.map(pattern => {
        if (typeof pattern === 'string')
            return relative(cwd, join(configFileDir, pattern));
        return relative(cwd, join(configFileDir, pattern.directory, pattern.files ?? stories[0]));
    });
    const patterns = [
        ...(options.config.entry ?? restEntry),
        ...(relativePatterns && relativePatterns.length > 0 ? relativePatterns : stories),
    ];
    const addons = localConfig.addons?.map(addon => (typeof addon === 'string' ? addon : addon.name)) ?? [];
    const builder = localConfig?.core?.builder &&
        (typeof localConfig.core.builder === 'string' ? localConfig.core.builder : localConfig.core.builder.name);
    const builderPackages = builder
        ? builder.startsWith('webpack')
            ? [`@storybook/builder-${builder}`, `@storybook/manager-${builder}`]
            : [builder]
        : [];
    const framework = localConfig.framework;
    const frameworkName = typeof framework === 'string' ? framework : framework?.name;
    const frameworks = frameworkName ? [frameworkName] : [];
    const viteConfigPath = typeof framework === 'object' &&
        framework?.name === '@storybook/react-vite' &&
        framework?.options?.builder?.viteConfigPath;
    const configs = viteConfigPath
        ? [toConfig('vite', viteConfigPath, { dir: cwd, containingFilePath: configFilePath })]
        : [];
    const hasVitestAddon = addons.some(addon => addon === '@storybook/addon-vitest');
    const coverageDeps = hasVitestAddon
        ? [
            toDependency('@vitest/coverage-v8', { optional: true }),
            toDependency('@vitest/coverage-istanbul', { optional: true }),
        ]
        : [];
    return [
        ...patterns.map(id => toEntry(id)),
        ...addons.map(id => toDeferResolve(id)),
        ...builderPackages.map(id => toDependency(id)),
        ...frameworks.map(id => toDependency(id)),
        ...coverageDeps,
        ...configs,
    ];
};
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    if (hasDependency('@storybook/addon-docs') || hasDependency('@storybook/addon-essentials')) {
        registerCompiler({ extension: '.mdx', compiler: MDX.compiler });
    }
};
const resolveFromAST = getBabelInputs;
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    project,
    resolveConfig,
    resolveFromAST,
    registerCompilers,
};
export default plugin;
