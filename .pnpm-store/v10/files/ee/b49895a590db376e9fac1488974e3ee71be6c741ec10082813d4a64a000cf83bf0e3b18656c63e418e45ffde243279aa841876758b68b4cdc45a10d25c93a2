import { extractSpecifiers } from './typescript/follow-imports.js';
import { _parseFile } from './typescript/ast-nodes.js';
import { CacheConsultant } from './CacheConsultant.js';
import { getCompilerExtensions } from './compilers/index.js';
import { DEFAULT_EXTENSIONS } from './constants.js';
import { _getImportsAndExports } from './typescript/get-imports-and-exports.js';
import { createBunShellVisitor } from './typescript/visitors/script-visitors.js';
import { buildVisitor } from './typescript/visitors/walk.js';
import { createCustomModuleResolver, createGlobAliasResolver } from './typescript/resolve-module-names.js';
import { SourceFileManager } from './typescript/SourceFileManager.js';
import { compact } from './util/array.js';
import { timerify } from './util/Performance.js';
import { extname, isInNodeModules, toAbsolute } from './util/path.js';
export class ProjectPrincipal {
    entryPaths = new Set();
    projectPaths = new Set();
    programPaths = new Set();
    skipExportsAnalysis = new Set();
    pluginCtx = {
        filePath: '',
        sourceText: '',
        addScript: () => { },
        addImport: () => { },
        markImportExpressionHandled: () => { },
        addImportGlob: () => { },
        markExportRegistered: () => { },
    };
    pluginVisitorObjects = [];
    _visitor;
    _localRefsVisitor;
    syncCompilers = new Map();
    asyncCompilers = new Map();
    scopedSyncCompilers = new Map();
    scopedAsyncCompilers = new Map();
    paths = new Map();
    rootDirs = new Map();
    tsConfigFile;
    extensions = new Set(DEFAULT_EXTENSIONS);
    cache;
    toSourceFilePath;
    findWorkspacePackageTarget;
    findWorkspaceNameByFilePath;
    fileManager;
    resolveModule = () => undefined;
    resolveGlobPattern = pattern => [pattern];
    resolvedFiles = new Set();
    deletedFiles = new Set();
    onPathAdded;
    constructor(options, toSourceFilePath, findWorkspacePackageTarget, findWorkspaceNameByFilePath) {
        this.cache = new CacheConsultant('root', options);
        this.toSourceFilePath = toSourceFilePath;
        this.findWorkspacePackageTarget = findWorkspacePackageTarget;
        this.findWorkspaceNameByFilePath = findWorkspaceNameByFilePath;
        this.tsConfigFile = options.tsConfigFile ? toAbsolute(options.tsConfigFile, options.cwd) : undefined;
        this.pluginVisitorObjects.push(createBunShellVisitor(this.pluginCtx));
        this.fileManager = new SourceFileManager({
            compilers: [this.syncCompilers, this.asyncCompilers],
        });
        this.walkAndAnalyze = timerify(this.walkAndAnalyze.bind(this), 'walkAndAnalyze');
    }
    addCompilers(workspaceName, compilers) {
        for (const [ext, compiler] of compilers[0]) {
            const workspaceCompilers = this.scopedSyncCompilers.get(ext);
            if (workspaceCompilers) {
                workspaceCompilers.set(workspaceName, compiler);
            }
            else {
                const workspaceCompilers = new Map([[workspaceName, compiler]]);
                this.scopedSyncCompilers.set(ext, workspaceCompilers);
                this.syncCompilers.set(ext, (source, filePath) => {
                    const owner = this.findWorkspaceNameByFilePath(filePath);
                    return ((owner ? workspaceCompilers.get(owner) : undefined) ?? compiler)(source, filePath);
                });
                this.extensions.add(ext);
            }
        }
        for (const [ext, compiler] of compilers[1]) {
            const workspaceCompilers = this.scopedAsyncCompilers.get(ext);
            if (workspaceCompilers) {
                workspaceCompilers.set(workspaceName, compiler);
            }
            else {
                const workspaceCompilers = new Map([[workspaceName, compiler]]);
                this.scopedAsyncCompilers.set(ext, workspaceCompilers);
                this.asyncCompilers.set(ext, (source, filePath) => {
                    const owner = this.findWorkspaceNameByFilePath(filePath);
                    return ((owner ? workspaceCompilers.get(owner) : undefined) ?? compiler)(source, filePath);
                });
                this.extensions.add(ext);
            }
        }
    }
    addPaths(paths, basePath, scope) {
        if (!paths)
            return;
        const scoped = this.paths.get(scope) ?? {};
        for (const key in paths) {
            const prefixes = paths[key].map(prefix => toAbsolute(prefix, basePath));
            scoped[key] = key in scoped ? compact([...scoped[key], ...prefixes]) : prefixes;
        }
        this.paths.set(scope, scoped);
    }
    addRootDirs(rootDirs, scope) {
        if (!rootDirs?.length)
            return;
        const scoped = this.rootDirs.get(scope) ?? [];
        this.rootDirs.set(scope, compact([...scoped, ...rootDirs]));
    }
    init() {
        this.extensions = new Set([
            ...DEFAULT_EXTENSIONS,
            ...getCompilerExtensions([this.syncCompilers, this.asyncCompilers]),
        ]);
        const customCompilerExtensions = getCompilerExtensions([this.syncCompilers, this.asyncCompilers]);
        const scopedPaths = this.paths.size > 0 ? Array.from(this.paths, ([scope, paths]) => ({ scope, paths })) : undefined;
        const scopedRootDirs = this.rootDirs.size > 0 ? Array.from(this.rootDirs, ([scope, rootDirs]) => ({ scope, rootDirs })) : undefined;
        this.resolveModule = createCustomModuleResolver({ scopedPaths, scopedRootDirs }, customCompilerExtensions, this.toSourceFilePath, this.findWorkspacePackageTarget, this.tsConfigFile);
        this.resolveGlobPattern = createGlobAliasResolver(scopedPaths);
    }
    readFile(filePath) {
        return this.fileManager.readFile(filePath);
    }
    hasAcceptedExtension(filePath) {
        return this.extensions.has(extname(filePath));
    }
    addEntryPath(filePath, options) {
        if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
            this.entryPaths.add(filePath);
            this.projectPaths.add(filePath);
            if (options?.skipExportsAnalysis)
                this.skipExportsAnalysis.add(filePath);
            this.onPathAdded?.(filePath);
        }
    }
    addEntryPaths(filePaths, options) {
        for (const filePath of filePaths)
            this.addEntryPath(filePath, options);
    }
    addProgramPath(filePath) {
        if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
            this.programPaths.add(filePath);
            this.onPathAdded?.(filePath);
        }
    }
    addProjectPath(filePath) {
        if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
            this.projectPaths.add(filePath);
            this.deletedFiles.delete(filePath);
        }
    }
    removeProjectPath(filePath) {
        this.entryPaths.delete(filePath);
        this.projectPaths.delete(filePath);
        this.invalidateFile(filePath);
        this.deletedFiles.add(filePath);
    }
    async runAsyncCompilers() {
        const add = timerify(this.fileManager.compileAndAddSourceFile.bind(this.fileManager));
        for (const filePath of this.projectPaths)
            if (this.asyncCompilers.has(extname(filePath)))
                await add(filePath);
    }
    walkAndAnalyze(analyzeFile) {
        this.resolvedFiles.clear();
        const visited = new Set([...this.entryPaths, ...this.programPaths]);
        this.onPathAdded = p => visited.add(p);
        try {
            for (const filePath of visited) {
                const isProjectPath = this.projectPaths.has(filePath);
                const cachedFile = isProjectPath ? this.cache.getCachedFile(filePath) : undefined;
                if (cachedFile) {
                    const internalPaths = analyzeFile(filePath, undefined, '', cachedFile);
                    if (internalPaths)
                        for (const p of internalPaths)
                            visited.add(p);
                    continue;
                }
                const sourceText = this.fileManager.readFile(filePath);
                if (!sourceText) {
                    if (isProjectPath)
                        analyzeFile(filePath, undefined, '');
                    continue;
                }
                try {
                    const result = _parseFile(filePath, sourceText);
                    this.fileManager.sourceTextCache.delete(filePath);
                    if (isProjectPath) {
                        const internalPaths = analyzeFile(filePath, result, sourceText);
                        if (internalPaths)
                            for (const p of internalPaths)
                                visited.add(p);
                    }
                    else {
                        for (const specifier of extractSpecifiers(result, sourceText, filePath)) {
                            const resolved = this.resolveSpecifier(specifier, filePath);
                            if (resolved && !isInNodeModules(resolved))
                                visited.add(resolved);
                        }
                    }
                }
                catch {
                }
            }
        }
        finally {
            this.onPathAdded = undefined;
        }
        this.resolvedFiles = visited;
    }
    getUsedResolvedFiles() {
        this.resolvedFiles.clear();
        const visited = new Set([...this.entryPaths, ...this.programPaths]);
        for (const filePath of visited) {
            const sourceText = this.fileManager.readFile(filePath);
            if (!sourceText)
                continue;
            try {
                const result = _parseFile(filePath, sourceText);
                for (const specifier of extractSpecifiers(result, sourceText, filePath)) {
                    const resolved = this.resolveSpecifier(specifier, filePath);
                    if (resolved && !isInNodeModules(resolved))
                        visited.add(resolved);
                }
            }
            catch {
            }
        }
        this.resolvedFiles = visited;
        return Array.from(this.projectPaths).filter(filePath => visited.has(filePath));
    }
    resolveSpecifier(specifier, containingFile) {
        return this.resolveModule(specifier, containingFile)?.resolvedFileName;
    }
    getUnreferencedFiles() {
        return Array.from(this.projectPaths).filter(filePath => !this.resolvedFiles.has(filePath));
    }
    analyzeSourceFile(filePath, options, ignoreExportsUsedInFile, parseResult, sourceText, cachedFile) {
        if (cachedFile)
            return cachedFile;
        const cached = this.cache.getCachedFile(filePath);
        if (cached)
            return cached;
        sourceText ??= this.fileManager.readFile(filePath);
        const skipExports = this.skipExportsAnalysis.has(filePath);
        if (options.isFixExports || options.isFixTypes) {
            const ext = extname(filePath);
            if (!DEFAULT_EXTENSIONS.has(ext) && (this.syncCompilers.has(ext) || this.asyncCompilers.has(ext))) {
                options = { ...options, isFixExports: false, isFixTypes: false };
            }
        }
        const visitor = ignoreExportsUsedInFile
            ? (this._localRefsVisitor ??= buildVisitor(this.pluginVisitorObjects, true))
            : (this._visitor ??= buildVisitor(this.pluginVisitorObjects, false));
        return _getImportsAndExports(filePath, sourceText, this.resolveModule, options, ignoreExportsUsedInFile, skipExports, visitor, this.pluginVisitorObjects.length > 0 ? this.pluginCtx : undefined, parseResult);
    }
    invalidateFile(filePath) {
        this.fileManager.invalidate(filePath);
    }
    reconcileCache(graph) {
        for (const [filePath, file] of graph) {
            const fd = this.cache.getFileDescriptor(filePath);
            if (!fd?.meta)
                continue;
            fd.meta.data = { ...file, internalImportCache: undefined, importedBy: undefined };
        }
        this.cache.reconcile();
    }
}
