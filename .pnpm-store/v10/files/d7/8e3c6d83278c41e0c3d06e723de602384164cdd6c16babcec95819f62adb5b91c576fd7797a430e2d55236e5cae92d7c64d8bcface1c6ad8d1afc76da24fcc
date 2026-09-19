import { substringBefore } from '../../util/string.js';
import { CONTINUE } from '../constants.js';
import { walkDown } from '../walk-down.js';
export const buildExportsTree = (graph, entryPaths, options) => {
    const traces = [];
    const processFile = (filePath, file) => {
        for (const exportId of options.identifier ? [options.identifier] : file.exports.keys()) {
            if (!options.identifier || file.exports.has(exportId)) {
                const trace = buildExportTree(graph, entryPaths, filePath, exportId);
                if (trace)
                    traces.push(trace);
            }
        }
    };
    if (options.filePath) {
        const file = graph.get(options.filePath);
        if (file)
            processFile(options.filePath, file);
    }
    else {
        for (const [filePath, file] of graph)
            processFile(filePath, file);
    }
    return traces;
};
const buildExportTree = (graph, entryPaths, filePath, identifier) => {
    const file = graph.get(filePath);
    const rootNode = {
        filePath,
        identifier,
        refs: filterRefs(file?.importedBy?.refs, identifier),
        isEntry: entryPaths.has(filePath),
        children: [],
        originalId: undefined,
        via: undefined,
    };
    const nodeMap = new Map();
    nodeMap.set(`${filePath}:${identifier}`, rootNode);
    walkDown(graph, filePath, identifier, (sourceFile, sourceId, importingFile, id, isEntry, via) => {
        const importMaps = graph.get(importingFile)?.imports.internal.get(sourceFile);
        const importRefs = importMaps?.refs;
        const ns = substringBefore(id, '.');
        if (via === 'importNS' && !hasRelevantRef(importRefs, id) && !isNsReExported(importMaps, ns))
            return CONTINUE;
        const key = `${importingFile}:${id}`;
        const isRenamed = via.endsWith('As') && sourceId !== ns;
        const refs = filterRefs(importRefs, id);
        const childNode = nodeMap.get(key) ?? {
            filePath: importingFile,
            identifier: id,
            originalId: isRenamed ? sourceId : undefined,
            via,
            refs,
            isEntry,
            children: [],
        };
        nodeMap.set(key, childNode);
        let parentNode = nodeMap.get(`${sourceFile}:${sourceId}`);
        if (!parentNode) {
            for (const [k, v] of nodeMap) {
                if (k.startsWith(`${sourceFile}:${sourceId}.`) || k === `${sourceFile}:${sourceId}`) {
                    parentNode = v;
                    break;
                }
            }
        }
        (parentNode ?? rootNode).children.push(childNode);
        return CONTINUE;
    }, entryPaths);
    pruneReExportStarOnlyBranches(rootNode);
    return rootNode;
};
const filterRefs = (refs, id) => {
    if (!refs)
        return [];
    return Array.from(refs).filter(ref => id === ref || id.startsWith(`${ref}.`) || ref.startsWith(`${id}.`));
};
const hasRelevantRef = (refs, id) => {
    if (!refs || refs.size === 0)
        return false;
    return Array.from(refs).some(ref => ref === id || ref.startsWith(`${id}.`));
};
const isNsReExported = (importMaps, ns) => {
    if (!importMaps)
        return false;
    return importMaps.reExportAs.has(ns) || importMaps.reExportNs.has(ns);
};
const hasNonReExportStar = (node) => {
    if (node.via && node.via !== 'reExportStar')
        return true;
    return node.children.some(child => hasNonReExportStar(child));
};
const pruneReExportStarOnlyBranches = (node) => {
    node.children = node.children.filter(child => hasNonReExportStar(child));
    for (const child of node.children)
        pruneReExportStarOnlyBranches(child);
};
