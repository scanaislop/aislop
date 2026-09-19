import type { Identifier, ModuleGraph, Position } from '../../types/module-graph.ts';
import { type Via } from '../walk-down.ts';
export interface UsageLocation extends Position {
    filePath: string;
    identifier: string;
    isEntry: boolean;
    via: Via;
}
export interface UsageResult {
    locations: UsageLocation[];
    reExportingEntryFile: string | undefined;
}
export declare const getUsage: (graph: ModuleGraph, entryPaths: Set<string>, filePath: string, identifier: Identifier) => UsageResult;
