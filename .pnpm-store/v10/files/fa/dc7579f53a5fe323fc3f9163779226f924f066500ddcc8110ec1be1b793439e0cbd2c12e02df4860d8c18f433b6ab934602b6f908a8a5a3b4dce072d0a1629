import { FileExtensionInfo } from "typescript";
//#region src/custom-language.d.ts
/**
 * A custom language (such as Vue or Astro) that allows the `tsc` generator to
 * process non-standard file types when generating `.d.ts` files.
 *
 * If the language is supported via Volar, {@linkcode volarTypeScript} and
 * {@linkcode createVolarPlugins} must both be provided.
 */
interface CustomLanguage {
  extensionPatterns: RegExp[];
  tsFileExtensionInfos?: FileExtensionInfo[];
  toTsFilename?: (id: string) => string;
  /**
   * The contents of the `@volar/typescript` package.
   *
   * If the language is supported via Volar, this must be provided together
   * with {@linkcode createVolarPlugins}.
   */
  volarTypeScript?: typeof import("@volar/typescript");
  /**
   * Creates the Volar language plugins for this language.
   *
   * If the language is supported via Volar, this must be provided together
   * with {@linkcode volarTypeScript}.
   */
  createVolarPlugins?: Parameters<(typeof import("@volar/typescript"))["proxyCreateProgram"]>[2];
}
declare class LanguageContext {
  languages: CustomLanguage[];
  patterns: RegExp[];
  constructor(languages: CustomLanguage[]);
  isCustomLanguageFile(id: string): boolean;
  isUsingVolar(): boolean;
  getExtraFileExtensions(): FileExtensionInfo[] | undefined;
  getCreateProgram(ts: typeof import("typescript")): typeof import("typescript").createProgram;
  toTsFilename(id: string): string;
}
//#endregion
export { LanguageContext as n, CustomLanguage as t };