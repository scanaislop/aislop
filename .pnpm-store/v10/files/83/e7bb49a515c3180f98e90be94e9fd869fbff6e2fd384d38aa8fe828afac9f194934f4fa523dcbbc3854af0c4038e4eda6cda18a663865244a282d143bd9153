import { escape } from "./escape.js";
import { template } from "./template.js";

//#region src/compat/string/templateSettings.d.ts
declare const templateSettings: {
  escape: RegExp;
  evaluate: RegExp;
  interpolate: RegExp;
  variable: string;
  imports: {
    _: {
      escape: typeof escape;
      template: typeof template;
    };
  };
};
//#endregion
export { templateSettings };