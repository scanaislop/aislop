import type { IgnoreIssues } from './types/config.ts';
import type { ConfigurationHint, Issue, TagHint } from './types/issues.ts';
import type { MainOptions } from './util/create-options.ts';
import type { WorkspaceFilePathFilter } from './util/workspace-file-filter.ts';
export type CollectorIssues = ReturnType<IssueCollector['getIssues']>;
export declare class IssueCollector {
    private cwd;
    private rules;
    private workspaceFilter;
    private issues;
    private counters;
    private referencedFiles;
    private configurationHints;
    private tagHints;
    private ignorePatterns;
    private ignoreFilesPatterns;
    private isMatch;
    private isFileMatch;
    private issueMatchers;
    private isTrackUnusedIgnorePatterns;
    private unusedIgnorePatterns;
    private unusedIgnoreFilesPatterns;
    private selectedWorkspaces;
    constructor(options: MainOptions);
    setWorkspaceFilter(workspaceFilePathFilter: WorkspaceFilePathFilter | undefined): void;
    setSelectedWorkspaces(selectedWorkspaces: Set<string> | undefined): void;
    private collectIgnorePatterns;
    addIgnorePatterns(entries: {
        pattern: string;
        id: string;
        workspaceName?: string;
    }[]): void;
    addIgnoreFilesPatterns(entries: {
        pattern: string;
        id: string;
        workspaceName?: string;
    }[]): void;
    private markUsedPatterns;
    setIgnoreIssues(ignoreIssues?: IgnoreIssues): void;
    private shouldIgnoreIssue;
    addFileCounts({ processed, unused }: {
        processed: number;
        unused: number;
    }): void;
    addFilesIssues(filePaths: string[]): void;
    addIssue(issue: Issue): true | undefined;
    addConfigurationHint(issue: ConfigurationHint): void;
    addTagHint(issue: TagHint): void;
    purge(): Set<string>;
    getIssues(): {
        issues: import("./types/issues.ts").Issues;
        counters: import("./types/issues.ts").Counters;
        tagHints: Set<TagHint>;
        configurationHints: ConfigurationHint[];
    };
    getUnusedIgnorePatternHints(options: MainOptions): ConfigurationHint[];
    private retainedIssues;
    retainIssue(issue: Issue): void;
    getRetainedIssues(): Issue[];
}
