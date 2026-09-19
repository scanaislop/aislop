import type { GraphExplorer } from '../graph-explorer/explorer.ts';
import type { FileNode, ModuleGraph } from '../types/module-graph.ts';
import type { Export, ImportLookup, InternalImport } from './types.ts';
export declare const buildImportLookup: (fileNode: FileNode) => ImportLookup;
export declare const buildExportsMap: (fileNode: FileNode, filePath: string, graph: ModuleGraph, entryPaths: Set<string>, explorer: GraphExplorer, importLookup: ImportLookup) => Map<string, Export>;
export declare const buildInternalImports: (fileNode: FileNode, explorer: GraphExplorer, importLookup: ImportLookup) => InternalImport[];
