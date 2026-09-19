import picomatch from 'picomatch';
import { DEFAULT_EXTENSIONS, ROOT_WORKSPACE_NAME } from './constants.js';
import { pluginNames } from './types/PluginNames.js';
import { arrayify, compact, partition } from './util/array.js';
import { createWorkspaceGraph } from './util/create-workspace-graph.js';
import { isDirectory, isFile } from './util/fs.js';
import { _dirGlob, prependDirToPattern, removeProductionSuffix } from './util/glob.js';
import { graphSequencer } from './util/graph-sequencer.js';
import mapWorkspaces from './util/map-workspaces.js';
import { join, relative } from './util/path.js';
import { normalizePluginConfig } from './util/plugin.js';
import { toRegexOrString } from './util/regex.js';
import { ELLIPSIS } from './util/string.js';
import { byPathDepth } from './util/workspace.js';
import { createWorkspaceFilePathFilter } from './util/workspace-file-filter.js';
import { selectWorkspaces } from './util/workspace-selectors.js';
const defaultBaseFilenamePattern = '{index,cli,main}';
export const isDefaultPattern = (type, id) => {
    if (type === 'project')
        return id.startsWith('**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts');
    return (id.startsWith('{index,cli,main}.{js,mjs,cjs,jsx,ts,tsx,mts,cts') ||
        id.startsWith('src/{index,cli,main}.{js,mjs,cjs,jsx,ts,tsx,mts,cts'));
};
const getDefaultWorkspaceConfig = (extensions = []) => {
    const exts = [...DEFAULT_EXTENSIONS, ...extensions].map(ext => ext.slice(1)).join(',');
    return {
        entry: [`${defaultBaseFilenamePattern}.{${exts}}!`, `src/${defaultBaseFilenamePattern}.{${exts}}!`],
        project: [`**/*.{${exts}}!`],
    };
};
const isPluginName = (name) => pluginNames.includes(name);
const defaultConfig = {
    ignore: [],
    ignoreBinaries: [],
    ignoreDependencies: [],
    ignoreFiles: [],
    cycles: {},
    ignoreIssues: {},
    ignoreMembers: [],
    ignoreUnresolved: [],
    ignoreWorkspaces: [],
    ignoreExportsUsedInFile: false,
    isIncludeEntryExports: false,
    syncCompilers: new Map(),
    asyncCompilers: new Map(),
    rootPluginConfigs: {},
};
export class ConfigurationChief {
    cwd;
    rawConfig;
    isProduction;
    isStrict;
    isIncludeEntryExports;
    config;
    workspace;
    selectedWorkspaces;
    workspaceFilePathFilter = () => true;
    workspaces;
    ignoredWorkspacePatterns = [];
    workspacePackages = new Map();
    workspacesByPkgName = new Map();
    workspacesByDir = new Map();
    additionalWorkspaceNames = new Set();
    availableWorkspaceNames = [];
    availableWorkspacePkgNames = new Set();
    availableWorkspaceDirs = [];
    availableWorkspaceDirsWithSlash = [];
    workspaceGraph = new Map();
    workspaceByFileCache = new Map();
    constructor(options) {
        this.cwd = options.cwd;
        this.isProduction = options.isProduction;
        this.isStrict = options.isStrict;
        this.isIncludeEntryExports = options.isIncludeEntryExports;
        this.workspace = options.workspace;
        this.workspaces = options.workspaces;
        this.rawConfig = options.parsedConfig;
        this.config = this.normalize(options.parsedConfig ?? {});
        this.findWorkspaceByFilePath = this.findWorkspaceByFilePath.bind(this);
    }
    getConfigurationHints() {
        const hints = [];
        if (this.rawConfig) {
            if (this.workspacePackages.size > 1) {
                const entry = arrayify(this.rawConfig.entry);
                if (entry.length > 0) {
                    const identifier = `[${entry[0]}${entry.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
                    hints.push({ type: 'entry-top-level', identifier });
                }
                const project = arrayify(this.rawConfig.project);
                if (project.length > 0) {
                    const identifier = `[${project[0]}${project.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
                    hints.push({ type: 'project-top-level', identifier });
                }
            }
        }
        return hints;
    }
    normalize(rawConfig) {
        const ignore = arrayify(rawConfig.ignore ?? defaultConfig.ignore);
        const ignoreFiles = arrayify(rawConfig.ignoreFiles ?? defaultConfig.ignoreFiles);
        const ignoreBinaries = rawConfig.ignoreBinaries ?? [];
        const ignoreDependencies = rawConfig.ignoreDependencies ?? [];
        const ignoreMembers = rawConfig.ignoreMembers ?? [];
        const ignoreUnresolved = rawConfig.ignoreUnresolved ?? [];
        const ignoreExportsUsedInFile = rawConfig.ignoreExportsUsedInFile ?? false;
        const cycles = rawConfig.cycles ?? {};
        const ignoreIssues = rawConfig.ignoreIssues ?? {};
        const ignoreWorkspaces = rawConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;
        const isIncludeEntryExports = rawConfig.includeEntryExports ?? this.isIncludeEntryExports;
        const { syncCompilers, asyncCompilers } = rawConfig;
        const rootPluginConfigs = {};
        for (const [pluginName, pluginConfig] of Object.entries(rawConfig)) {
            if (isPluginName(pluginName)) {
                rootPluginConfigs[pluginName] = normalizePluginConfig(pluginConfig);
            }
        }
        return {
            ignore,
            ignoreFiles,
            cycles,
            ignoreBinaries,
            ignoreDependencies,
            ignoreMembers,
            ignoreUnresolved,
            ignoreExportsUsedInFile,
            ignoreIssues,
            ignoreWorkspaces,
            isIncludeEntryExports,
            syncCompilers: new Map(Object.entries(syncCompilers ?? {})),
            asyncCompilers: new Map(Object.entries(asyncCompilers ?? {})),
            rootPluginConfigs,
        };
    }
    async getWorkspaces() {
        this.ignoredWorkspacePatterns = this.getIgnoredWorkspacePatterns();
        this.additionalWorkspaceNames = await this.getAdditionalWorkspaceNames();
        const workspaceNames = compact([...this.getListedWorkspaces(), ...this.additionalWorkspaceNames]);
        const [packages, wsPkgNames] = await mapWorkspaces(this.cwd, [...workspaceNames, '.']);
        this.workspacePackages = packages;
        this.availableWorkspaceNames = this.getAvailableWorkspaceNames(packages.keys());
        this.availableWorkspacePkgNames = wsPkgNames;
        this.availableWorkspaceDirs = this.availableWorkspaceNames
            .sort(byPathDepth)
            .reverse()
            .map(dir => join(this.cwd, dir));
        this.availableWorkspaceDirsWithSlash = this.availableWorkspaceDirs.map(dir => `${dir}/`);
        this.workspaceGraph = createWorkspaceGraph(this.cwd, this.availableWorkspaceNames, wsPkgNames, packages);
        this.selectedWorkspaces = this.getSelectedWorkspaces();
        this.workspaceFilePathFilter = createWorkspaceFilePathFilter(this.cwd, this.selectedWorkspaces, this.availableWorkspaceNames);
        const includedWorkspaces = this.getIncludedWorkspaces();
        for (const workspace of includedWorkspaces) {
            this.workspacesByPkgName.set(workspace.pkgName, workspace);
            this.workspacesByDir.set(workspace.dir, workspace);
        }
        const sorted = graphSequencer(this.workspaceGraph, Array.from(this.workspacesByDir.keys()).filter(dir => this.workspaceGraph.has(dir)));
        const [root, rest] = partition(sorted.chunks.flat(), dir => dir === this.cwd);
        return [...root, ...rest.reverse()].map(dir => this.workspacesByDir.get(dir));
    }
    getListedWorkspaces() {
        return this.workspaces.map(pattern => pattern.replace(/(?<=!?)\.\//, ''));
    }
    getIgnoredWorkspaces() {
        const ignoreWorkspaces = this.config.ignoreWorkspaces;
        if (this.isProduction)
            return ignoreWorkspaces.map(removeProductionSuffix);
        return ignoreWorkspaces.filter(pattern => !pattern.endsWith('!'));
    }
    getIgnoredWorkspacePatterns() {
        const ignoredWorkspacesManifest = this.getListedWorkspaces()
            .filter(name => name.startsWith('!'))
            .map(name => name.replace(/^!/, ''));
        return [...ignoredWorkspacesManifest, ...this.getIgnoredWorkspaces()];
    }
    getConfiguredWorkspaceKeys() {
        const initialWorkspaces = this.rawConfig?.workspaces
            ? Object.keys(this.rawConfig.workspaces)
            : [ROOT_WORKSPACE_NAME];
        const ignoreWorkspaces = this.getIgnoredWorkspaces();
        return initialWorkspaces.filter(workspaceName => !ignoreWorkspaces.includes(workspaceName));
    }
    async getAdditionalWorkspaceNames() {
        const workspaceKeys = this.getConfiguredWorkspaceKeys();
        const patterns = workspaceKeys.filter(key => key.includes('*'));
        const dirs = workspaceKeys.filter(key => !key.includes('*'));
        const globbedDirs = await _dirGlob({ patterns, cwd: this.cwd });
        const isIgnored = picomatch(this.ignoredWorkspacePatterns);
        return new Set([...dirs, ...globbedDirs].filter(name => name !== ROOT_WORKSPACE_NAME && !isIgnored(name)));
    }
    getAvailableWorkspaceNames(names) {
        const availableWorkspaceNames = [];
        const [ignore, patterns] = partition(this.ignoredWorkspacePatterns, pattern => pattern.startsWith('!'));
        const ignoreSliced = ignore.map(pattern => pattern.slice(1));
        const isIgnored = picomatch(patterns, { ignore: ignoreSliced });
        for (const name of names) {
            if (!isIgnored(name)) {
                availableWorkspaceNames.push(name);
            }
        }
        return availableWorkspaceNames;
    }
    getIncludedWorkspaces() {
        const selectedWorkspaces = this.selectedWorkspaces;
        const isAncestor = (name, ancestor) => ancestor !== name && (ancestor === ROOT_WORKSPACE_NAME || name.startsWith(`${ancestor}/`));
        const getAncestors = (name) => this.availableWorkspaceNames.filter(a => isAncestor(name, a));
        const workspaceNames = selectedWorkspaces
            ? Array.from(selectedWorkspaces).flatMap(name => [...getAncestors(name), name])
            : this.availableWorkspaceNames;
        const ws = new Set(selectedWorkspaces && this.isStrict ? selectedWorkspaces : workspaceNames);
        if (selectedWorkspaces && !this.isStrict) {
            const graph = this.workspaceGraph;
            const initialWorkspaceDirs = new Set(workspaceNames.map(name => join(this.cwd, name)));
            const includedWorkspaceDirs = new Set(initialWorkspaceDirs);
            const pendingWorkspaceDirs = [...initialWorkspaceDirs];
            for (let index = 0; index < pendingWorkspaceDirs.length; index++) {
                const dependencies = graph.get(pendingWorkspaceDirs[index]);
                if (!dependencies)
                    continue;
                for (const dependency of dependencies) {
                    if (!graph.has(dependency) || includedWorkspaceDirs.has(dependency))
                        continue;
                    includedWorkspaceDirs.add(dependency);
                    pendingWorkspaceDirs.push(dependency);
                }
            }
            for (const [dir, dependencies] of graph) {
                for (const dependency of dependencies) {
                    if (!initialWorkspaceDirs.has(dependency))
                        continue;
                    includedWorkspaceDirs.add(dir);
                    break;
                }
            }
            for (const dir of includedWorkspaceDirs)
                ws.add(relative(this.cwd, dir));
        }
        return Array.from(ws)
            .sort(byPathDepth)
            .map((name) => {
            const dir = join(this.cwd, name);
            const pkg = this.workspacePackages.get(name);
            const pkgName = pkg?.pkgName ?? `KNIP_ADDED_${name}`;
            const manifestPath = pkg?.manifestPath ?? join(dir, 'package.json');
            const manifestStr = pkg?.manifestStr ?? '';
            const workspaceConfig = this.getWorkspaceConfig(name);
            const ignoreMembers = workspaceConfig.ignoreMembers?.map(toRegexOrString) ?? [];
            return {
                name,
                pkgName,
                dir,
                config: this.getConfigForWorkspace(name),
                ancestors: getAncestors(name),
                manifestPath,
                manifestStr,
                ignoreMembers,
            };
        });
    }
    getManifestForWorkspace(name) {
        return this.workspacePackages.get(name)?.manifest;
    }
    getDescendentWorkspaces(name) {
        const prefix = `${name}/`;
        return this.availableWorkspaceNames.filter(workspaceName => workspaceName !== name && (name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(prefix)));
    }
    getIgnoredWorkspacesFor(name) {
        return this.ignoredWorkspacePatterns.filter(workspaceName => workspaceName !== name && (name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name)));
    }
    createIgnoredWorkspaceMatcher(name, dir) {
        const ignoredWorkspaces = this.getIgnoredWorkspacesFor(name);
        if (ignoredWorkspaces.length === 0)
            return () => false;
        return (filePath) => {
            const relativePath = filePath.startsWith(dir) ? filePath.slice(dir.length + 1) : filePath;
            return picomatch.isMatch(relativePath, ignoredWorkspaces);
        };
    }
    getNegatedWorkspacePatterns(name) {
        const descendentWorkspaces = this.getDescendentWorkspaces(name);
        const matchName = new RegExp(`^${name}/`);
        const ignoredWorkspaces = this.getIgnoredWorkspacesFor(name);
        const endMatch = /\/\*{1,2}$|\/$|$/;
        return [...ignoredWorkspaces, ...descendentWorkspaces]
            .map(workspaceName => workspaceName.replace(matchName, ''))
            .map(workspaceName => `!${workspaceName.replace(endMatch, '/**')}`);
    }
    getConfigKeyForWorkspace(workspaceName) {
        return this.getConfiguredWorkspaceKeys()
            .sort(byPathDepth)
            .reverse()
            .find(pattern => picomatch.isMatch(workspaceName, pattern));
    }
    getSelectedWorkspaces() {
        if (!this.workspace)
            return;
        const workspaceSelectors = Array.isArray(this.workspace) ? this.workspace : [this.workspace];
        return selectWorkspaces(workspaceSelectors, this.cwd, this.workspacePackages, this.availableWorkspaceNames);
    }
    getWorkspaceConfig(workspaceName) {
        const key = this.getConfigKeyForWorkspace(workspaceName);
        if (!key)
            return {};
        const workspaces = this.rawConfig?.workspaces ?? {};
        if (key === ROOT_WORKSPACE_NAME && !(ROOT_WORKSPACE_NAME in workspaces))
            return this.rawConfig ?? {};
        return workspaces[key] ?? {};
    }
    getIgnores(workspaceName) {
        const workspaceConfig = this.getWorkspaceConfig(workspaceName);
        const ignoreBinaries = workspaceConfig.ignoreBinaries ?? [];
        const ignoreDependencies = workspaceConfig.ignoreDependencies ?? [];
        const ignoreUnresolved = workspaceConfig.ignoreUnresolved ?? [];
        if (workspaceName === ROOT_WORKSPACE_NAME) {
            const { ignoreBinaries: rootIgnoreBinaries, ignoreDependencies: rootIgnoreDependencies, ignoreUnresolved: rootIgnoreUnresolved, } = this.rawConfig ?? {};
            return {
                ignoreBinaries: compact([...ignoreBinaries, ...(rootIgnoreBinaries ?? [])]),
                ignoreDependencies: compact([...ignoreDependencies, ...(rootIgnoreDependencies ?? [])]),
                ignoreUnresolved: compact([...ignoreUnresolved, ...(rootIgnoreUnresolved ?? [])]),
            };
        }
        return { ignoreBinaries, ignoreDependencies, ignoreUnresolved };
    }
    getIgnoreIssues() {
        const ignoreIssues = { ...this.config.ignoreIssues };
        for (const name of this.availableWorkspaceNames) {
            if (name === ROOT_WORKSPACE_NAME)
                continue;
            const workspaceIgnoreIssues = this.getWorkspaceConfig(name).ignoreIssues;
            if (!workspaceIgnoreIssues)
                continue;
            for (const [pattern, issueTypes] of Object.entries(workspaceIgnoreIssues)) {
                const id = prependDirToPattern(name, pattern);
                ignoreIssues[id] = ignoreIssues[id] ? [...ignoreIssues[id], ...issueTypes] : issueTypes;
            }
        }
        return ignoreIssues;
    }
    getConfigForWorkspace(workspaceName, extensions) {
        const baseConfig = getDefaultWorkspaceConfig(extensions);
        const workspaceConfig = this.getWorkspaceConfig(workspaceName);
        const entry = workspaceConfig.entry ? arrayify(workspaceConfig.entry) : baseConfig.entry;
        const project = workspaceConfig.project ? arrayify(workspaceConfig.project) : baseConfig.project;
        const paths = workspaceConfig.paths ?? {};
        const ignore = arrayify(workspaceConfig.ignore);
        const ignoreFiles = arrayify(workspaceConfig.ignoreFiles);
        const ignoreExportsUsedInFile = workspaceConfig.ignoreExportsUsedInFile ?? this.config.ignoreExportsUsedInFile;
        const isIncludeEntryExports = workspaceConfig.includeEntryExports ?? this.config.isIncludeEntryExports;
        const plugins = {};
        for (const [pluginName, pluginConfig] of Object.entries(this.config.rootPluginConfigs)) {
            if (typeof pluginConfig !== 'undefined')
                plugins[pluginName] = pluginConfig;
        }
        for (const [pluginName, pluginConfig] of Object.entries(workspaceConfig)) {
            if (isPluginName(pluginName)) {
                plugins[pluginName] = normalizePluginConfig(pluginConfig);
            }
        }
        return { entry, project, paths, ignore, ignoreFiles, ignoreExportsUsedInFile, isIncludeEntryExports, ...plugins };
    }
    findWorkspaceByFilePath(filePath) {
        if (this.workspaceByFileCache.has(filePath))
            return this.workspaceByFileCache.get(filePath);
        let workspace;
        for (let i = 0; i < this.availableWorkspaceDirsWithSlash.length; i++) {
            if (filePath.startsWith(this.availableWorkspaceDirsWithSlash[i])) {
                workspace = this.workspacesByDir.get(this.availableWorkspaceDirs[i]);
                break;
            }
        }
        this.workspaceByFileCache.set(filePath, workspace);
        return workspace;
    }
    getUnusedIgnoredWorkspaces() {
        const ignoredWorkspaceNames = this.config.ignoreWorkspaces.map(removeProductionSuffix);
        const matchesWorkspace = (pattern) => {
            for (const name of this.workspacePackages.keys())
                if (picomatch.isMatch(name, pattern))
                    return true;
            for (const name of this.additionalWorkspaceNames)
                if (picomatch.isMatch(name, pattern))
                    return true;
            return false;
        };
        return ignoredWorkspaceNames
            .filter(ignoredWorkspaceName => !matchesWorkspace(ignoredWorkspaceName))
            .filter(ignoredWorkspaceName => {
            const dir = join(this.cwd, ignoredWorkspaceName);
            return !isDirectory(dir) || isFile(dir, 'package.json');
        });
    }
    getUnusedConfiguredWorkspaces() {
        if (!this.rawConfig?.workspaces)
            return [];
        const unused = [];
        for (const key of Object.keys(this.rawConfig.workspaces)) {
            if (key.includes('*')) {
                const isMatch = picomatch(key);
                let isUsed = false;
                for (const name of this.workspacePackages.keys()) {
                    if (isMatch(name)) {
                        isUsed = true;
                        break;
                    }
                }
                if (!isUsed)
                    unused.push(key);
            }
            else if (!this.workspacePackages.has(key)) {
                unused.push(key);
            }
        }
        return unused;
    }
}
