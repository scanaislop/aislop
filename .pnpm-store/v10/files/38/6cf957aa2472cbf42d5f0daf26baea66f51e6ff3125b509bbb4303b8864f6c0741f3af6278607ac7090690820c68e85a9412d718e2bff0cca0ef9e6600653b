import { readFileSync } from 'node:fs';
import { invalidateCache } from '../graph-explorer/cache.js';
import { debugLog } from './debug.js';
import { isFile } from './fs.js';
import { updateImportMap } from './module-graph.js';
import { toAbsolute, toPosix, toRelative } from './path.js';
import { clearModuleResolutionCaches } from '../typescript/resolve-module-names.js';
import { clearGlobCache } from './glob-cache.js';
import { clearResolverCache } from './resolve.js';
const createUpdate = (options) => {
    const duration = performance.now() - options.startTime;
    const mem = process.memoryUsage().heapUsed;
    return { duration, mem };
};
export const getSessionHandler = async (options, { analyzedFiles, analyzeSourceFile, chief, collector, analyze, principal, graph, isIgnored, onFileChange, unreferencedFiles, entryPaths, }) => {
    const handleFileChanges = async (changes) => {
        const startTime = performance.now();
        const added = new Set();
        const deleted = new Set();
        const modified = new Set();
        for (const change of changes) {
            const filePath = toAbsolute(change.filePath, options.cwd);
            const relativePath = toRelative(change.filePath, options.cwd);
            if (isIgnored(filePath)) {
                debugLog('*', `ignoring ${change.type} ${relativePath}`);
                continue;
            }
            const workspace = chief.findWorkspaceByFilePath(filePath);
            if (!workspace)
                continue;
            switch (change.type) {
                case 'added':
                    principal.addProjectPath(filePath);
                    principal.deletedFiles.delete(filePath);
                    if (principal.projectPaths.has(filePath))
                        added.add(filePath);
                    debugLog(workspace.name, `Watcher: + ${relativePath}`);
                    break;
                case 'deleted':
                    deleted.add(filePath);
                    analyzedFiles.delete(filePath);
                    principal.removeProjectPath(filePath);
                    debugLog(workspace.name, `Watcher: - ${relativePath}`);
                    break;
                default: {
                    const cached = principal.fileManager.sourceTextCache.get(filePath);
                    if (cached !== undefined && cached === readFileSync(filePath, 'utf8')) {
                        debugLog(workspace.name, `Watcher: = ${relativePath}`);
                        continue;
                    }
                    modified.add(filePath);
                    debugLog(workspace.name, `Watcher: ± ${relativePath}`);
                    break;
                }
            }
            principal.invalidateFile(filePath);
        }
        if (added.size === 0 && deleted.size === 0 && modified.size === 0)
            return;
        clearResolverCache();
        clearModuleResolutionCaches();
        clearGlobCache();
        invalidateCache(graph);
        unreferencedFiles.clear();
        const cachedUnusedFiles = collector.purge();
        for (const filePath of added)
            cachedUnusedFiles.add(filePath);
        for (const filePath of deleted)
            cachedUnusedFiles.delete(filePath);
        const filePaths = principal.getUsedResolvedFiles();
        if (added.size > 0 || deleted.size > 0) {
            graph.clear();
            for (const filePath of filePaths) {
                const workspace = chief.findWorkspaceByFilePath(filePath);
                if (workspace) {
                    analyzeSourceFile(filePath, principal);
                }
            }
        }
        else {
            for (const [filePath, file] of graph) {
                if (filePaths.includes(filePath)) {
                    file.importedBy = undefined;
                }
                else {
                    graph.delete(filePath);
                    analyzedFiles.delete(filePath);
                    const workspace = chief.findWorkspaceByFilePath(filePath);
                    if (workspace && principal.projectPaths.has(filePath))
                        cachedUnusedFiles.add(filePath);
                }
            }
            for (const filePath of filePaths) {
                if (!graph.has(filePath)) {
                    const workspace = chief.findWorkspaceByFilePath(filePath);
                    if (workspace) {
                        analyzeSourceFile(filePath, principal);
                    }
                }
            }
            for (const filePath of modified) {
                if (!cachedUnusedFiles.has(filePath)) {
                    const workspace = chief.findWorkspaceByFilePath(filePath);
                    if (workspace) {
                        if (principal.projectPaths.has(filePath) || graph.has(filePath)) {
                            analyzeSourceFile(filePath, principal);
                        }
                    }
                }
            }
            for (const filePath of filePaths) {
                const file = graph.get(filePath);
                if (file?.internalImportCache)
                    updateImportMap(file, file.internalImportCache, graph);
            }
        }
        await analyze();
        const unusedFiles = [...cachedUnusedFiles].filter(filePath => !analyzedFiles.has(filePath));
        collector.addFilesIssues(unusedFiles);
        collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });
        for (const issue of collector.getRetainedIssues())
            collector.addIssue(issue);
        const update = createUpdate({ startTime });
        if (onFileChange)
            onFileChange(Object.assign({ issues: getIssues().issues }, update));
        return update;
    };
    const listener = (eventType, filePath) => {
        debugLog('*', `(raw) ${eventType} ${filePath}`);
        if (typeof filePath === 'string') {
            const normalizedPath = toPosix(filePath);
            const type = eventType === 'rename' ? (isFile(options.cwd, normalizedPath) ? 'added' : 'deleted') : 'modified';
            handleFileChanges([{ type, filePath: normalizedPath }]);
        }
    };
    const getIssues = () => collector.getIssues();
    const getEntryPaths = () => entryPaths;
    const getGraph = () => graph;
    if (onFileChange)
        onFileChange({ issues: getIssues().issues });
    return { listener, handleFileChanges, getEntryPaths, getGraph, getIssues };
};
