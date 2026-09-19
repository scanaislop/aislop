import { ConsoleStreamer } from './ConsoleStreamer.ts';
import type { MainOptions } from './util/create-options.ts';
export type Results = Awaited<ReturnType<typeof run>>['results'];
export declare const run: (options: MainOptions) => Promise<{
    results: {
        issues: import("./types/issues.ts").Issues;
        counters: import("./types/issues.ts").Counters;
        tagHints: Set<import("./types/issues.ts").TagHint>;
        configurationHints: import("./types/issues.ts").ConfigurationHint[];
        selectedWorkspaces: string[] | undefined;
        includedWorkspaceDirs: string[];
        enabledPlugins: {
            [k: string]: string[];
        };
    };
    session: {
        listener: import("node:fs").WatchListener<string | Buffer<ArrayBufferLike>>;
        handleFileChanges: (changes: import("./util/watch.ts").WatchChange[]) => Promise<{
            duration: number;
            mem: number;
        } | undefined>;
        getEntryPaths: () => Set<string>;
        getGraph: () => import("./types/module-graph.ts").ModuleGraph;
        getIssues: () => {
            issues: import("./types/issues.ts").Issues;
            counters: import("./types/issues.ts").Counters;
            tagHints: Set<import("./types/issues.ts").TagHint>;
            configurationHints: import("./types/issues.ts").ConfigurationHint[];
        };
    } | undefined;
    streamer: ConsoleStreamer;
}>;
