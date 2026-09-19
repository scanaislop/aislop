import type { FileNode, Import, ImportMaps, ModuleGraph } from '../types/module-graph.ts';
export declare const getIgnoredCycleImportFlags: (includeDynamicImports: boolean) => number;
export declare const getExportedIdentifiers: (graph: ModuleGraph, filePath: string, visited?: Set<string>) => Map<string, boolean>;
export declare const getRuntimeSuccessors: (node: FileNode, ignoredFlags?: number) => Set<string>;
export declare const getRuntimeImport: (node: FileNode, filePath: string, ignoredFlags?: number) => {
    kind: string;
    specifier: string;
    pos: number;
    line: number;
    col: number;
} | undefined;
export declare const hasStrictlyEnumReferences: (importsForExport: ImportMaps | undefined, identifier: string) => boolean;
export declare const getIssueType: (hasOnlyNsReference: boolean, isType: boolean) => "exports" | "nsExports" | "nsTypes" | "types";
export declare const findImportRef: (graph: ModuleGraph, importingFile: string, importedFile: string, identifier: string) => Import | undefined;
