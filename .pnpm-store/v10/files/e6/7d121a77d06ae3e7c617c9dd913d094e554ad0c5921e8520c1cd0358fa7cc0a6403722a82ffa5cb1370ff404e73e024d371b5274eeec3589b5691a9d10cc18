import { type TemplateLiteral, type TSEnumDeclaration, type TSModuleDeclaration } from 'oxc-parser';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from '../types/config.ts';
import type { SymbolType } from '../types/issues.ts';
import type { ExportMember } from '../types/module-graph.ts';
declare const parseFile: (filePath: string, sourceText: string) => import("oxc-parser").ParseResult;
export declare const _parseFile: typeof parseFile;
export declare const isAmbientDeclarationFile: (filePath: string, sourceText: string) => boolean;
export type ResolveModule = (specifier: string, containingFile: string) => ResolvedModule | undefined;
export interface ResolvedModule {
    resolvedFileName: string;
    isExternalLibraryImport: boolean;
    packageName?: string;
}
export declare const buildLineStarts: (sourceText: string) => number[];
export declare const getLineAndCol: (lineStarts: number[], pos: number) => {
    line: number;
    col: number;
};
export declare const stripQuotes: (name: string) => string;
export declare const isStringLiteral: (node: any) => boolean;
export declare const getStringValue: (node: any) => string | undefined;
export declare const getScriptFromTemplate: (template: TemplateLiteral) => string;
export declare const getScriptFromArg: (arg: any) => string | undefined;
export declare const getSafeScriptFromArgs: (executable: any, argsArray: any) => string | undefined;
export declare const shouldCountRefs: (ignoreExportsUsedInFile: IgnoreExportsUsedInFile, type: SymbolType) => boolean | undefined;
export declare function extractNamespaceMembers(decl: TSModuleDeclaration, options: GetImportsAndExportsOptions, lineStarts: number[], getJSDocTags: (start: number) => Set<string>, prefix?: string): ExportMember[];
export declare const collectAugmentationRefs: (node: TSModuleDeclaration) => string[];
export declare function extractEnumMembers(decl: TSEnumDeclaration, options: GetImportsAndExportsOptions, lineStarts: number[], getJSDocTags: (start: number) => Set<string>): ExportMember[];
export {};
