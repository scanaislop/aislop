import { getAliasReExportMap, getPassThroughReExportSources, getStarReExportSources } from '../visitors.js';
export const isEnumerated = (graph, filePath, importsForExport, identifier) => {
    const seen = new Set();
    const walkDown = (path, importMaps, id) => {
        if (!importMaps || seen.has(path))
            return false;
        seen.add(path);
        if (importMaps.enumerated?.has(id))
            return true;
        const follow = (sources, nextId) => {
            for (const source of sources) {
                if (walkDown(source, graph.get(source)?.importedBy, nextId))
                    return true;
            }
            return false;
        };
        const directSources = getPassThroughReExportSources(importMaps, id);
        if (directSources && follow(directSources, id))
            return true;
        const starSources = getStarReExportSources(importMaps);
        if (starSources && follow(starSources, id))
            return true;
        const aliasMap = getAliasReExportMap(importMaps, id);
        if (aliasMap) {
            for (const [alias, sources] of aliasMap) {
                if (follow(sources, alias))
                    return true;
            }
        }
        return false;
    };
    return walkDown(filePath, importsForExport, identifier);
};
