import { readFile } from 'node:fs/promises';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import { JsonCatalogPeeker } from './JsonCatalogPeeker.js';
import { PackagePeeker } from './PackagePeeker.js';
import { extractCatalogReferences, parseCatalog } from './util/catalog.js';
import { extname } from './util/path.js';
import { YamlCatalogPeeker } from './YamlCatalogPeeker.js';
export class CatalogCounselor {
    filePath;
    entries = new Set();
    referencedEntries = new Set();
    referenceIssues = [];
    fileContent;
    constructor(options) {
        this.filePath = options.catalog.filePath;
        this.entries = parseCatalog(options.catalog);
    }
    addReferencedCatalogEntry(entryName) {
        this.referencedEntries.add(entryName);
    }
    addReference({ catalogName, packageName }) {
        this.addReferencedCatalogEntry(`${catalogName}:${packageName}`);
    }
    addWorkspace({ name: workspace, manifest, manifestPath: filePath, manifestStr, }) {
        const catalogReferences = extractCatalogReferences(manifest);
        if (catalogReferences.length === 0)
            return;
        const peeker = new PackagePeeker(manifestStr);
        for (const { catalogName, packageName } of catalogReferences) {
            const catalogEntryName = `${catalogName}:${packageName}`;
            this.addReferencedCatalogEntry(catalogEntryName);
            if (!this.entries.has(catalogEntryName)) {
                const pos = peeker.getCatalogReferenceLocation(packageName, catalogName);
                this.referenceIssues.push({
                    type: 'catalogReferences',
                    filePath,
                    workspace,
                    symbol: packageName,
                    parentSymbol: catalogName,
                    fixes: [],
                    ...pos,
                });
            }
        }
    }
    async settleCatalogIssues(options) {
        const filePath = this.filePath;
        const workspace = ROOT_WORKSPACE_NAME;
        const catalogIssues = [];
        if (this.entries.size > 0) {
            this.fileContent = await readFile(filePath, 'utf-8');
            const isYaml = ['.yml', '.yaml'].includes(extname(filePath));
            const Peeker = isYaml ? YamlCatalogPeeker : JsonCatalogPeeker;
            const peeker = new Peeker(this.fileContent);
            for (const entry of this.entries.keys()) {
                if (!this.referencedEntries.has(entry)) {
                    const [parentSymbol, symbol] = entry.split(':');
                    const pos = peeker.getLocation(parentSymbol, symbol);
                    const fixes = [];
                    if (options.isFix && isYaml && pos)
                        fixes.push([pos.line, 0, 0]);
                    catalogIssues.push({ type: 'catalog', filePath, workspace, symbol, parentSymbol, fixes, ...pos });
                }
            }
        }
        return [...catalogIssues, ...this.referenceIssues];
    }
}
