import { IMPORT_STAR } from '../../constants.js';
import { getCachedUsage, setCachedUsage } from '../cache.js';
import { CONTINUE } from '../constants.js';
import { findImportRef } from '../utils.js';
import { walkDown } from '../walk-down.js';
export const getUsage = (graph, entryPaths, filePath, identifier) => {
    const cached = getCachedUsage(graph, filePath, identifier);
    if (cached)
        return cached;
    const locations = [];
    let reExportingEntryFile;
    if (entryPaths.has(filePath)) {
        reExportingEntryFile = filePath;
    }
    walkDown(graph, filePath, identifier, (sourceFile, sourceId, importingFile, id, isEntry, via) => {
        const lookupId = via === 'importNS' ? IMPORT_STAR : sourceId;
        const importRef = findImportRef(graph, importingFile, sourceFile, lookupId);
        locations.push({
            filePath: importingFile,
            identifier: id,
            pos: importRef?.pos ?? 0,
            line: importRef?.line ?? 0,
            col: importRef?.col ?? 0,
            isEntry,
            via,
        });
        if (isEntry && !reExportingEntryFile)
            reExportingEntryFile = importingFile;
        return CONTINUE;
    }, entryPaths);
    const result = { locations, reExportingEntryFile };
    setCachedUsage(graph, filePath, identifier, result);
    return result;
};
