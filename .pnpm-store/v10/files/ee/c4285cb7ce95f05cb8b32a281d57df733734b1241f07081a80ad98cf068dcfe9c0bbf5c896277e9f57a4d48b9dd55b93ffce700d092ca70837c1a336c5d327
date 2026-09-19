import type { DependencyNodes } from '../graph-explorer/operations/get-dependency-usage.ts';
import type { ModuleGraph } from '../types/module-graph.ts';
export interface PackageJsonFile {
    dependenciesUsage: Map<string, DependencyNodes>;
}
export declare const buildPackageJsonDescriptor: (graph: ModuleGraph, entryPaths: Set<string>) => PackageJsonFile;
