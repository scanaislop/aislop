import type { ModuleGraph } from '../types/module-graph.ts';
export type Via = 'import' | 'importAs' | 'importNS' | 'reExport' | 'reExportAs' | 'reExportNS' | 'reExportStar';
type Visitor = (sourceFile: string, identifier: string, importingFile: string, identifierPath: string, isEntry: boolean, via: Via) => 'continue' | 'stop' | undefined;
export declare const walkDown: (graph: ModuleGraph, filePath: string, identifier: string, visitor: Visitor, entryPaths: Set<string>, visited?: Set<string>) => boolean;
export {};
