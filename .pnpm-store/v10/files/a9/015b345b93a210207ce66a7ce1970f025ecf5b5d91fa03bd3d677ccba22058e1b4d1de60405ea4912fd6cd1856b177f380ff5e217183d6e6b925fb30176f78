import type { ReporterOptions } from '../types/issues.ts';
export interface JSONReportNamedItem {
    name: string;
}
export interface JSONReportItem extends JSONReportNamedItem {
    namespace?: string;
    kind?: string;
    specifier?: string;
    pos?: number;
    line?: number;
    col?: number;
}
export type JSONReportEntry = {
    file: string;
    owners?: Array<JSONReportNamedItem>;
    binaries?: Array<JSONReportNamedItem>;
    catalog?: Array<JSONReportItem>;
    catalogReferences?: Array<JSONReportItem>;
    cycles?: Array<Array<JSONReportItem>>;
    dependencies?: Array<JSONReportItem>;
    devDependencies?: Array<JSONReportItem>;
    duplicates?: Array<Array<JSONReportItem>>;
    enumMembers?: Array<JSONReportItem>;
    exports?: Array<JSONReportItem>;
    files?: Array<JSONReportItem>;
    namespaceMembers?: Array<JSONReportItem>;
    nsExports?: Array<JSONReportItem>;
    nsTypes?: Array<JSONReportItem>;
    optionalPeerDependencies?: Array<JSONReportItem>;
    types?: Array<JSONReportItem>;
    unlisted?: Array<JSONReportNamedItem>;
    unresolved?: Array<JSONReportItem>;
};
export type JSONReport = {
    issues: Array<JSONReportEntry>;
};
export default _default;
declare function _default({ report, issues, options, cwd }: ReporterOptions): Promise<void>;
