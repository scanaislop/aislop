const caches = new WeakMap();
const createEmptyCache = () => ({
    definitions: new Map(),
    usage: new Map(),
    importLookup: new Map(),
    exportedIdentifiers: new Map(),
    generation: 0,
});
const getCache = (graph) => {
    let cache = caches.get(graph);
    if (!cache) {
        cache = createEmptyCache();
        caches.set(graph, cache);
    }
    return cache;
};
export const invalidateCache = (graph) => {
    const cache = caches.get(graph);
    if (cache) {
        cache.definitions.clear();
        cache.usage.clear();
        cache.importLookup.clear();
        cache.exportedIdentifiers.clear();
        cache.generation++;
    }
};
export const getCachedDefinition = (graph, filePath, identifier) => {
    const cache = caches.get(graph);
    if (!cache)
        return undefined;
    const fileCache = cache.definitions.get(filePath);
    if (!fileCache)
        return undefined;
    return fileCache.has(identifier) ? fileCache.get(identifier) : undefined;
};
export const setCachedDefinition = (graph, filePath, identifier, result) => {
    const cache = getCache(graph);
    let fileCache = cache.definitions.get(filePath);
    if (!fileCache) {
        fileCache = new Map();
        cache.definitions.set(filePath, fileCache);
    }
    fileCache.set(identifier, result);
};
export const getCachedUsage = (graph, filePath, identifier) => {
    const cache = caches.get(graph);
    if (!cache)
        return undefined;
    const fileCache = cache.usage.get(filePath);
    if (!fileCache)
        return undefined;
    return fileCache.get(identifier);
};
export const setCachedUsage = (graph, filePath, identifier, result) => {
    const cache = getCache(graph);
    let fileCache = cache.usage.get(filePath);
    if (!fileCache) {
        fileCache = new Map();
        cache.usage.set(filePath, fileCache);
    }
    fileCache.set(identifier, result);
};
export const getCachedExportedIdentifiers = (graph, filePath) => {
    const cache = caches.get(graph);
    if (!cache)
        return undefined;
    return cache.exportedIdentifiers.get(filePath);
};
export const setCachedExportedIdentifiers = (graph, filePath, result) => {
    const cache = getCache(graph);
    cache.exportedIdentifiers.set(filePath, result);
};
