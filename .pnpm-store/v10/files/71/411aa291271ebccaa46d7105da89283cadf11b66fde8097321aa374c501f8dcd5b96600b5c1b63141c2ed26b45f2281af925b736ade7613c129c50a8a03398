import { IMPORT_STAR } from '../constants.js';
import { getExportedIdentifiers } from '../graph-explorer/utils.js';
import { forEachAliasReExport, forEachNamespaceReExport, forEachPassThroughReExport, getStarReExportSources, } from '../graph-explorer/visitors.js';
import { compareStrings } from '../util/string.js';
const FALLBACK_LOCATION = { identifier: undefined, pos: 0, line: 0, col: 0 };
export const buildImportLookup = (fileNode) => {
    const imports = new Map();
    for (const _import of fileNode.imports.imports) {
        if (!_import.filePath || !_import.identifier)
            continue;
        let fileMap = imports.get(_import.filePath);
        if (!fileMap) {
            fileMap = new Map();
            imports.set(_import.filePath, fileMap);
        }
        const list = fileMap.get(_import.identifier) ?? [];
        list.push(_import);
        fileMap.set(_import.identifier, list);
    }
    return imports;
};
const excludeReExports = (location) => location.via !== 'reExport' &&
    location.via !== 'reExportAs' &&
    location.via !== 'reExportNS' &&
    location.via !== 'reExportStar';
export const buildExportsMap = (fileNode, filePath, graph, entryPaths, explorer, importLookup) => {
    const exportsMap = new Map();
    const getImport = (importedFilePath, id) => importLookup.get(importedFilePath)?.get(id)?.[0] ?? FALLBACK_LOCATION;
    const addExport = (identifier, sourceFilePath, pos, line, col, childExports) => {
        if (exportsMap.has(identifier))
            return;
        const usage = explorer.getUsage(sourceFilePath, identifier);
        const usageEntryPaths = new Set();
        for (const location of usage.locations)
            if (location.isEntry)
                usageEntryPaths.add(location.filePath);
        if (entryPaths.has(sourceFilePath))
            usageEntryPaths.add(sourceFilePath);
        exportsMap.set(identifier, {
            filePath,
            identifier,
            pos,
            line,
            col,
            importLocations: usage.locations
                .filter(excludeReExports)
                .sort((a, b) => compareStrings(a.filePath, b.filePath) || a.line - b.line || a.col - b.col),
            entryPaths: usageEntryPaths,
            exports: childExports,
        });
    };
    for (const _export of fileNode.exports.values()) {
        addExport(_export.identifier, filePath, _export.pos, _export.line, _export.col, undefined);
    }
    for (const [importedFilePath, importMaps] of fileNode.imports.internal) {
        forEachPassThroughReExport(importMaps, (id, _sources) => {
            if (exportsMap.has(id))
                return;
            const directImport = getImport(importedFilePath, id);
            addExport(id, filePath, directImport.pos, directImport.line, directImport.col, undefined);
        });
        forEachAliasReExport(importMaps, (id, alias, _sources) => {
            if (exportsMap.has(alias))
                return;
            const aliasImport = getImport(importedFilePath, id);
            addExport(alias, filePath, aliasImport.pos, aliasImport.line, aliasImport.col, undefined);
        });
        forEachNamespaceReExport(importMaps, (namespace, _sources) => {
            if (exportsMap.has(namespace))
                return;
            const namespaceImport = getImport(importedFilePath, namespace) ?? getImport(importedFilePath, IMPORT_STAR);
            const childExports = [];
            const exportedIdentifiers = getExportedIdentifiers(graph, importedFilePath);
            for (const identifier of exportedIdentifiers.keys()) {
                const usage = explorer.getUsage(importedFilePath, identifier);
                const usageEntryPaths = new Set();
                for (const location of usage.locations)
                    if (location.isEntry)
                        usageEntryPaths.add(location.filePath);
                if (entryPaths.has(importedFilePath))
                    usageEntryPaths.add(importedFilePath);
                childExports.push({
                    filePath,
                    identifier,
                    pos: namespaceImport.pos,
                    line: namespaceImport.line,
                    col: namespaceImport.col,
                    importLocations: usage.locations,
                    entryPaths: usageEntryPaths,
                    exports: undefined,
                });
            }
            addExport(namespace, filePath, namespaceImport.pos, namespaceImport.line, namespaceImport.col, childExports);
        });
        const starSources = getStarReExportSources(importMaps);
        if (starSources) {
            const starImport = getImport(importedFilePath, IMPORT_STAR);
            const exportedIdentifiers = getExportedIdentifiers(graph, importedFilePath);
            for (const [nestedIdentifier] of exportedIdentifiers) {
                if (nestedIdentifier === 'default')
                    continue;
                addExport(nestedIdentifier, importedFilePath, starImport.pos, starImport.line, starImport.col, undefined);
            }
        }
    }
    return exportsMap;
};
export const buildInternalImports = (fileNode, explorer, importLookup) => {
    const getImport = (importedFilePath, id) => importLookup.get(importedFilePath)?.get(id)?.[0] ?? FALLBACK_LOCATION;
    const internalImports = [];
    const addInternalImport = (importedFilePath, identifier, alias = identifier, importLine, importCol) => {
        const resolution = explorer.resolveDefinition(importedFilePath, identifier);
        const location = resolution?.type === 'symbol' && resolution.exportNode
            ? {
                filePath: resolution.filePath,
                pos: resolution.exportNode.pos,
                line: resolution.exportNode.line,
                col: resolution.exportNode.col,
            }
            : { filePath: importedFilePath, pos: 0, line: 0, col: 0 };
        internalImports.push({
            identifier: alias,
            filePath: location.filePath,
            pos: location.pos,
            line: location.line,
            col: location.col,
            importLine,
            importCol,
        });
    };
    for (const [importedFilePath, importMaps] of fileNode.imports.internal) {
        for (const identifier of importMaps.import.keys()) {
            const _import = getImport(importedFilePath, identifier);
            addInternalImport(importedFilePath, identifier, _import.identifier, _import.line, _import.col);
        }
        for (const [identifier, aliasMap] of importMaps.importAs) {
            for (const [alias] of aliasMap) {
                const _import = getImport(importedFilePath, identifier);
                addInternalImport(importedFilePath, identifier, alias, _import.line, _import.col);
            }
        }
        if (importMaps.importNs.size > 0) {
            const _import = getImport(importedFilePath, IMPORT_STAR);
            for (const namespace of importMaps.importNs.keys()) {
                addInternalImport(importedFilePath, namespace, namespace, _import.line, _import.col);
            }
        }
    }
    internalImports.sort((a, b) => a.importLine - b.importLine || a.importCol - b.importCol);
    return internalImports;
};
