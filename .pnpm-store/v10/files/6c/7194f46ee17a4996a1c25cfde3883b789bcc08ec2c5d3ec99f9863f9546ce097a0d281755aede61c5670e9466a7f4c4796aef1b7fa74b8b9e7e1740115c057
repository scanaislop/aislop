import { IMPORT_STAR } from '../constants.js';
export const forEachPassThroughReExport = (importMaps, callback) => {
    for (const [identifier, sources] of importMaps.reExport) {
        if (identifier === IMPORT_STAR)
            continue;
        if (callback(identifier, sources) === false)
            return false;
    }
    return true;
};
export const forEachAliasReExport = (importMaps, callback) => {
    for (const [identifier, aliasMap] of importMaps.reExportAs) {
        for (const [alias, sources] of aliasMap) {
            if (callback(identifier, alias, sources) === false)
                return false;
        }
    }
    return true;
};
export const forEachNamespaceReExport = (importMaps, callback) => {
    for (const [namespace, sources] of importMaps.reExportNs) {
        if (callback(namespace, sources) === false)
            return false;
    }
    return true;
};
export const getStarReExportSources = (importMaps) => importMaps.reExport.get(IMPORT_STAR);
export const getPassThroughReExportSources = (importMaps, identifier) => importMaps.reExport.get(identifier);
export const getAliasReExportMap = (importMaps, identifier) => importMaps.reExportAs.get(identifier);
export const getNamespaceReExportSources = (importMaps, namespace) => importMaps.reExportNs.get(namespace);
