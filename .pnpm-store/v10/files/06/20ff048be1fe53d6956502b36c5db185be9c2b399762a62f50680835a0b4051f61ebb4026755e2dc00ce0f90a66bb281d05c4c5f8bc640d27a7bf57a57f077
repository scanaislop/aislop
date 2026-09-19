import type { ModuleGraph } from '../../types/module-graph.ts';
export interface DependencyNode {
    filePath: string;
    specifier: string;
    binaryName: string | undefined;
    pos: number | undefined;
    line: number | undefined;
    col: number | undefined;
}
export interface DependencyNodes {
    packageName: string;
    imports: DependencyNode[];
}
export declare const getDependencyUsage: (graph: ModuleGraph, pattern?: string | RegExp) => Map<string, DependencyNodes>;
