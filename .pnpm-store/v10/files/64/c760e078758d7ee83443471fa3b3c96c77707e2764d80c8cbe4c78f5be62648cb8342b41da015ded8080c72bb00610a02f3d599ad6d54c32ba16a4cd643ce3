import type { WatchListener } from 'node:fs';
import type { ConfigurationChief } from '../ConfigurationChief.ts';
import type { IssueCollector } from '../IssueCollector.ts';
import type { ProjectPrincipal } from '../ProjectPrincipal.ts';
import type { Issues } from '../types/issues.ts';
import type { ModuleGraph } from '../types/module-graph.ts';
import type { MainOptions } from './create-options.ts';
export type OnFileChange = (options: {
    issues: Issues;
    duration?: number;
    mem?: number;
}) => void;
export type WatchChange = {
    type: 'added' | 'deleted' | 'modified';
    filePath: string;
};
export type SessionHandler = Awaited<ReturnType<typeof getSessionHandler>>;
type WatchOptions = {
    analyzedFiles: Set<string>;
    analyzeSourceFile: (filePath: string, principal: ProjectPrincipal) => void;
    chief: ConfigurationChief;
    collector: IssueCollector;
    analyze: () => Promise<void>;
    principal: ProjectPrincipal;
    graph: ModuleGraph;
    isIgnored: (path: string) => boolean;
    onFileChange?: OnFileChange;
    unreferencedFiles: Set<string>;
    entryPaths: Set<string>;
};
export declare const getSessionHandler: (options: MainOptions, { analyzedFiles, analyzeSourceFile, chief, collector, analyze, principal, graph, isIgnored, onFileChange, unreferencedFiles, entryPaths, }: WatchOptions) => Promise<{
    listener: WatchListener<string | Buffer<ArrayBufferLike>>;
    handleFileChanges: (changes: WatchChange[]) => Promise<{
        duration: number;
        mem: number;
    } | undefined>;
    getEntryPaths: () => Set<string>;
    getGraph: () => ModuleGraph;
    getIssues: () => {
        issues: Issues;
        counters: import("../types/issues.ts").Counters;
        tagHints: Set<import("../types/issues.ts").TagHint>;
        configurationHints: import("../types/issues.ts").ConfigurationHint[];
    };
}>;
export {};
