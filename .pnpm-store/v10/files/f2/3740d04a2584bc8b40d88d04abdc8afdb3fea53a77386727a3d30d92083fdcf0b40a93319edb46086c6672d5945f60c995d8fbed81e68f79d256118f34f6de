import { getCachedDefinition, setCachedDefinition } from '../cache.js';
import { CONTINUE, STOP } from '../constants.js';
import { walkUp } from '../walk-up.js';
export const resolveDefinition = (graph, filePath, identifier) => {
    const cached = getCachedDefinition(graph, filePath, identifier);
    if (cached !== undefined)
        return cached;
    const chain = [];
    let result = null;
    walkUp(graph, filePath, identifier, (resolvedPath, resolvedId, via) => {
        chain.push({ filePath: resolvedPath, identifier: resolvedId, via });
        if (via === 'self') {
            const node = graph.get(resolvedPath);
            const exportNode = node?.exports.get(resolvedId);
            result = {
                type: 'symbol',
                filePath: resolvedPath,
                identifier: resolvedId,
                exportNode,
                chain,
            };
            return STOP;
        }
        if (via === 'namespace') {
            result = {
                type: 'namespace',
                filePath: resolvedPath,
                identifier: resolvedId,
                exportNode: undefined,
                chain,
            };
            return STOP;
        }
        return CONTINUE;
    });
    setCachedDefinition(graph, filePath, identifier, result);
    return result;
};
