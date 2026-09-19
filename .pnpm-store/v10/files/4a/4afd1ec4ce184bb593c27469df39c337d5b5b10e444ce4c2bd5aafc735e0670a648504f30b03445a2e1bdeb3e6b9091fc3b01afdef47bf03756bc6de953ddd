import type { PluginOptions } from '../../types/config.ts';
import { type ConfigInput, type Input } from '../../util/input.ts';
import type { ESLintConfig, ESLintConfigDeprecated, OverrideConfigDeprecated, Settings } from './types.ts';
export declare const isFlatConfig: (fileName: string) => boolean;
export declare const getInputs: (config: ESLintConfigDeprecated | OverrideConfigDeprecated | ESLintConfig, options: PluginOptions) => (Input | ConfigInput)[];
export declare const getInputsFromSettings: (settings?: Settings) => Input[];
export declare const resolveFormatters: (formatters: string | string[]) => Set<Input>;
