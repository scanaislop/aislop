import type { ConfigurationChief } from '../ConfigurationChief.ts';
import { type Manifest } from '../util/package-json.ts';
export type ScriptParserContext = {
    rootManifest: Manifest | undefined;
    getManifest: (dir: string) => Manifest | undefined;
};
export declare const createScriptParserContext: (chief: ConfigurationChief) => ScriptParserContext;
