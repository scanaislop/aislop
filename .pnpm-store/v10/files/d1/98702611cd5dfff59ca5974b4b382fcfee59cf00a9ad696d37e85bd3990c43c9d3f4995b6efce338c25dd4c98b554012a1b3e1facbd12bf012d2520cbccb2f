import type { ReExportKind } from '../../session/types.ts';
import type { Export, Identifier, ModuleGraph } from '../../types/module-graph.ts';
interface TraversalStep {
    filePath: string;
    identifier: string;
    via: ReExportKind;
}
export interface DefinitionResult {
    type: 'symbol' | 'namespace';
    filePath: string;
    identifier: string;
    exportNode: Export | undefined;
    chain: TraversalStep[];
}
export declare const resolveDefinition: (graph: ModuleGraph, filePath: string, identifier: Identifier) => DefinitionResult | null;
export {};
