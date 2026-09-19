import type { Issue } from './types/issues.ts';
import type { Catalog, Catalogs, WorkspacePackage } from './types/package-json.ts';
import { type CatalogReference } from './util/catalog.ts';
import type { MainOptions } from './util/create-options.ts';
export type CatalogContainer = {
    filePath: string;
    catalog?: Catalog;
    catalogs?: Catalogs;
};
export declare class CatalogCounselor {
    private filePath;
    private entries;
    private referencedEntries;
    private referenceIssues;
    private fileContent?;
    constructor(options: MainOptions);
    private addReferencedCatalogEntry;
    addReference({ catalogName, packageName }: CatalogReference): void;
    addWorkspace({ name: workspace, manifest, manifestPath: filePath, manifestStr, }: Pick<WorkspacePackage, 'name' | 'manifest' | 'manifestPath' | 'manifestStr'>): void;
    settleCatalogIssues(options: MainOptions): Promise<Issue[]>;
}
