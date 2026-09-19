import type { Identifier, ModuleGraph } from '../../types/module-graph.ts';
import type { Via } from '../walk-down.ts';
export interface ExportsTreeNode {
    filePath: string;
    identifier: string;
    originalId: string | undefined;
    via: Via | undefined;
    refs: string[];
    isEntry: boolean;
    children: ExportsTreeNode[];
}
export declare const buildExportsTree: (graph: ModuleGraph, entryPaths: Set<string>, options: {
    filePath?: string;
    identifier?: Identifier;
}) => ExportsTreeNode[];
