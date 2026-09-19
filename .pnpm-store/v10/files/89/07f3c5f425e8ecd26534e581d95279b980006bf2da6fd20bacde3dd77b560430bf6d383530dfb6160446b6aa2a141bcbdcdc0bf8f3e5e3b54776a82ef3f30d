import type { IssueType } from '../types/issues.ts';
import type { PluginName } from '../types/PluginNames.ts';
type InputType = 'binary' | 'catalog' | 'entry' | 'project' | 'config' | 'dependency' | 'deferResolve' | 'deferResolveEntry' | 'alias' | 'ignore';
export interface Input {
    type: InputType;
    specifier: string;
    production?: boolean;
    optional?: boolean;
    isTypeOnly?: boolean;
    dir?: string;
    containingFilePath?: string;
    allowIncludeExports?: boolean;
    skipExportsAnalysis?: boolean;
    group?: string;
}
export interface ConfigInput extends Input {
    type: 'config';
    containingFilePath?: string;
    pluginName: PluginName;
}
export interface CatalogInput extends Input {
    type: 'catalog';
    catalogName: string;
}
interface AliasInput extends Input {
    type: 'alias';
    prefixes: string[];
}
interface IgnoreInput extends Input {
    type: 'ignore';
    issueType: IssueType;
}
type Options = {
    optional?: boolean;
    isTypeOnly?: boolean;
    dir?: string;
    containingFilePath?: string;
    allowIncludeExports?: boolean;
};
export declare const fromBinary: (input: Input) => string;
export declare const toBinary: (specifier: string, options?: Options) => Input;
export declare const isBinary: (input: Input) => boolean;
export declare const toCatalog: (specifier: string, catalogName: string) => CatalogInput;
export declare const isCatalog: (input: Input) => input is CatalogInput;
export declare const toEntry: (specifier: string) => Input;
export declare const isEntry: (input: Input) => boolean;
export declare const toProject: (specifier: string) => Input;
export declare const isProject: (input: Input) => boolean;
export declare const toProductionEntry: (specifier: string, options?: Options) => Input;
export declare const isProductionEntry: (input: Input) => boolean;
export declare const toConfig: (pluginName: PluginName, specifier: string, options?: Options) => ConfigInput;
export declare const isConfig: (input: Input) => input is ConfigInput;
export declare const toDependency: (specifier: string, options?: Options) => Input;
export declare const isDependency: (input: Input) => boolean;
export declare const toProductionDependency: (specifier: string) => Input;
export declare const toDeferResolve: (specifier: string, options?: Options) => Input;
export declare const isDeferResolve: (input: Input) => boolean;
export declare const toDeferResolveProductionEntry: (specifier: string, options?: Options) => Input;
export declare const isDeferResolveProductionEntry: (input: Input) => boolean;
export declare const toDeferResolveEntry: (specifier: string, options?: Options) => Input;
export declare const isDeferResolveEntry: (input: Input) => boolean;
export declare const toAlias: (specifier: string, prefix: string | string[], options?: Options) => AliasInput;
export declare const isAlias: (input: Input) => input is AliasInput;
export declare const toIgnore: (specifier: string, issueType: IssueType) => IgnoreInput;
export declare const isIgnore: (input: Input) => input is IgnoreInput;
export declare const toDebugString: (input: Input, cwd: string) => string;
export {};
