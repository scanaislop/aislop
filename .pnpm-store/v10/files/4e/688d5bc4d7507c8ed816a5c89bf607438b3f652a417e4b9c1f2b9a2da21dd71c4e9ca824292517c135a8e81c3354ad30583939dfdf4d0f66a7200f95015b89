export interface Config {
    set: (config: ConfigOptions) => void;
}
export interface ConfigOptions {
    basePath?: string | undefined;
    exclude?: string[] | undefined;
    files?: Array<FilePattern | string> | undefined;
    frameworks?: string[] | undefined;
    plugins?: Array<PluginName | InlinePluginDef> | undefined;
}
type PluginName = string;
type InlinePluginDef = Record<PluginName, InlinePluginType>;
type InlinePluginType = FactoryFnType | ConstructorFnType | ValueType;
type FactoryFnType = ['factory', FactoryFn];
type FactoryFn = (...params: any[]) => any;
type ConstructorFnType = ['type', ConstructorFn];
type ConstructorFn = Function | (new (...params: any[]) => any);
type ValueType = ['value', any];
interface FilePattern {
    pattern: string;
}
export {};
