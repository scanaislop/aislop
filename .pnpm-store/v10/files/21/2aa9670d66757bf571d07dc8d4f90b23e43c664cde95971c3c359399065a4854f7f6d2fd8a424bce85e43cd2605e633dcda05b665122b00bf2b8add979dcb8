import { invalidateCache as invalidateCacheInternal } from './cache.js';
import { buildExportsTree } from './operations/build-exports-tree.js';
import { findAllCycles } from './operations/find-all-cycles.js';
import { findCycles } from './operations/find-cycles.js';
import { getContention } from './operations/get-contention.js';
import { getDependencyUsage } from './operations/get-dependency-usage.js';
import { getUsage } from './operations/get-usage.js';
import { hasStrictlyNsReferences } from './operations/has-strictly-ns-references.js';
import { isEnumerated } from './operations/is-enumerated.js';
import { isReferenced } from './operations/is-referenced.js';
import { resolveDefinition } from './operations/resolve-definition.js';
export const createGraphExplorer = (graph, entryPaths) => {
    return {
        isReferenced: (filePath, identifier, options) => isReferenced(graph, entryPaths, filePath, identifier, options),
        hasStrictlyNsReferences: (filePath, identifier) => hasStrictlyNsReferences(graph, filePath, graph.get(filePath)?.importedBy, identifier),
        isEnumerated: (filePath, identifier) => isEnumerated(graph, filePath, graph.get(filePath)?.importedBy, identifier),
        buildExportsTree: (options) => buildExportsTree(graph, entryPaths, options),
        getDependencyUsage: (pattern) => getDependencyUsage(graph, pattern),
        resolveDefinition: (filePath, identifier) => resolveDefinition(graph, filePath, identifier),
        getUsage: (filePath, identifier) => getUsage(graph, entryPaths, filePath, identifier),
        findCycles: (filePath, maxDepth) => findCycles(graph, filePath, maxDepth),
        findAllCycles: (ignoredFlags) => findAllCycles(graph, ignoredFlags),
        getContention: (filePath) => getContention(graph, filePath),
        invalidateCache: () => invalidateCacheInternal(graph),
    };
};
