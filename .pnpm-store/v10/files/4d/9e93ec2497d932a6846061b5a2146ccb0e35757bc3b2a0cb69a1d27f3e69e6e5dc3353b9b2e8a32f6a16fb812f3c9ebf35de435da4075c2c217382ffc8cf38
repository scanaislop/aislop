export { _load as load } from './loader.ts';
import type { Plugin, PluginOptions, RawPluginConfiguration } from '../types/config.ts';
export declare const hasDependency: (dependencies: Set<string>, values: (string | RegExp)[]) => boolean;
export declare const normalizePluginConfig: (pluginConfig: RawPluginConfiguration) => boolean | {
    config: string[] | null;
    entry: string[] | null;
    project: string[];
};
export declare const loadConfigForPlugin: (configFilePath: string, plugin: Plugin, options: PluginOptions, pluginName: string) => Promise<any>;
