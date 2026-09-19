import { type Input } from '../../util/input.ts';
import type { Config, ConfigOptions } from './types.ts';
export declare const configFiles: string[];
export declare const inputsFromFrameworks: (frameworks: readonly string[]) => readonly Input[];
export declare const inputsFromPlugins: (plugins: ConfigOptions['plugins'], devDependencies: Record<string, string> | undefined) => readonly Input[];
export type ConfigFile = (config: Config) => void;
export declare const loadConfig: (configFile: ConfigFile) => ConfigOptions | undefined;
