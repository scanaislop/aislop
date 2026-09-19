import { ISSUE_TYPE_TITLE } from '../../constants.ts';
import type { Issue, IssueRecords, IssueSeverity, IssueSymbol, IssueType } from '../../types/issues.ts';
import { Table } from '../../util/table.ts';
export declare const dim: (text: string | number | null | undefined) => string;
export declare const bright: (text: string | number | null | undefined) => string;
export declare const getIssueTypeTitle: (reportType: keyof typeof ISSUE_TYPE_TITLE) => "Circular dependencies" | "Duplicate exports" | "Exported types in used namespace" | "Exports in used namespace" | "Referenced optional peerDependencies" | "Unlisted binaries" | "Unlisted dependencies" | "Unresolved catalog references" | "Unresolved imports" | "Unused catalog entries" | "Unused dependencies" | "Unused devDependencies" | "Unused exported enum members" | "Unused exported namespace members" | "Unused exported types" | "Unused exports" | "Unused files";
export declare const getColoredTitle: (title: string, count: number) => string;
export declare const getDimmedTitle: (title: string, count: number) => string;
type LogIssueLine = {
    owner?: string;
    filePath: string;
    symbols?: IssueSymbol[];
    parentSymbol?: string;
    severity?: IssueSeverity;
};
export declare const getIssueLine: ({ owner, filePath, symbols, parentSymbol, severity }: LogIssueLine, cwd: string) => string;
export declare const convert: (issue: Issue | IssueSymbol) => {
    namespace: string | undefined;
    name: string;
    kind: string | undefined;
    specifier: string | undefined;
    line: number | undefined;
    col: number | undefined;
    pos: number | undefined;
};
export declare const getTableForType: (issues: Issue[], cwd: string, options?: {
    isUseColors?: boolean;
}) => Table;
export declare const flattenIssues: (issues: IssueRecords) => Issue[];
export declare const getIssuePrefix: (type: IssueType) => string;
export declare const getIssueDescription: ({ type, symbol, symbols, parentSymbol }: Issue) => string;
export {};
