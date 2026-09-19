type PluginConfig<T = unknown> = {
    [key: string]: T;
};
export interface ConfiguredPlugin {
    [name: string]: PluginConfig;
}
type NamedPlugin = string;
type OutputConfig = NamedPlugin | ConfiguredPlugin;
type PresetNamesBase = 'client' | 'near-operation-file' | 'gql-tag-operations' | 'graphql-modules' | 'import-types';
export type PresetNames = `${PresetNamesBase}-preset` | PresetNamesBase;
type OutputPreset = {
    buildGeneratesSection: (options: unknown) => Promise<unknown>;
    prepareDocuments?: (outputFilePath: string, outputSpecificDocuments: unknown) => Promise<unknown>;
};
export declare function isConfigurationOutput(config: ConfiguredOutput | ConfiguredPlugin[]): config is ConfiguredOutput;
interface ConfiguredOutput {
    plugins?: OutputConfig[];
    preset?: PresetNames | OutputPreset;
}
export interface GraphqlCodegenTypes {
    generates: {
        [outputPath: string]: ConfiguredOutput | ConfiguredPlugin[];
    };
}
export declare const isGraphqlConfigTypes: (config: GraphqlCodegenTypes | GraphqlConfigTypes | GraphqlProjectsConfigTypes) => config is GraphqlConfigTypes;
export interface GraphqlConfigTypes {
    extensions?: {
        codegen?: GraphqlCodegenTypes;
    };
}
export declare const isGraphqlProjectsConfigTypes: (config: GraphqlCodegenTypes | GraphqlConfigTypes | GraphqlProjectsConfigTypes) => config is GraphqlProjectsConfigTypes;
export interface GraphqlProjectsConfigTypes {
    projects: {
        [projectName: string]: GraphqlConfigTypes;
    };
}
export {};
