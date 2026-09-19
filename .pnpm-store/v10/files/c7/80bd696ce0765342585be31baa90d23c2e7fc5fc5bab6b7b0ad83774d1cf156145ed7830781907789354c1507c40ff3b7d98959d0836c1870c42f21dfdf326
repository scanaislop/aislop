import type { Fix, Fixes } from './exports.ts';
import type { IssueSymbol, SymbolType } from './issues.ts';
export type Identifier = string;
type FilePath = string;
type NamespaceOrAlias = string;
type Reference = string;
type References = Set<Reference>;
type Tags = Set<string>;
export interface Position {
    pos: number;
    line: number;
    col: number;
}
export type IdToFileMap = Map<Identifier, Set<FilePath>>;
export type IdToNsToFileMap = Map<Identifier, Map<NamespaceOrAlias, Set<FilePath>>>;
export type ImportMaps = {
    refs: References;
    enumerated: References | undefined;
    import: IdToFileMap;
    importAs: IdToNsToFileMap;
    importNs: IdToFileMap;
    reExport: IdToFileMap;
    reExportNs: IdToFileMap;
    reExportAs: IdToNsToFileMap;
};
export type ImportMap = Map<FilePath, ImportMaps>;
export interface Import extends Position {
    readonly specifier: string;
    readonly filePath: string | undefined;
    readonly identifier: string | undefined;
    readonly isTypeOnly: boolean;
    readonly modifiers: number;
    readonly jsDocTags: Tags | undefined;
}
export interface ExternalRef {
    readonly specifier: string;
    readonly identifier: string | undefined;
}
export interface Export extends Position {
    readonly identifier: Identifier;
    readonly type: SymbolType;
    readonly members: ExportMember[];
    jsDocTags: Tags;
    hasRefsInFile: boolean;
    isRegistered: boolean;
    referencedIn: Set<string> | undefined;
    readonly fixes: Fixes;
    isReExport: boolean;
}
export interface ExportMember extends Position {
    readonly identifier: Identifier;
    readonly type: SymbolType;
    readonly fix: Fix;
    jsDocTags: Tags;
    readonly flags: number;
    hasRefsInFile: boolean;
}
type ExportMap = Map<Identifier, Export>;
export type Imports = Set<Import>;
export type FileNode = {
    imports: {
        readonly internal: ImportMap;
        readonly external: Set<Import>;
        readonly externalRefs: Set<ExternalRef>;
        unresolved: Set<Import>;
        readonly programFiles: Set<FilePath>;
        readonly entryFiles: Set<FilePath>;
        readonly imports: Imports;
    };
    exports: ExportMap;
    duplicates: Iterable<Array<IssueSymbol>>;
    scripts: Set<string>;
    importGlobs: ImportGlob[];
    importedBy: undefined | ImportMaps;
    internalImportCache: undefined | ImportMap;
};
export interface ImportGlob {
    patterns: string[];
    base?: string;
    cwd?: string;
    filter?: RegExp;
}
export type ModuleGraph = Map<FilePath, FileNode>;
export {};
