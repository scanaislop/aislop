import type { CollectorIssues } from '../IssueCollector.ts';
import { type Results } from '../run.ts';
import type { MainOptions } from '../util/create-options.ts';
import type { WatchChange } from '../util/watch.ts';
import { type FileDescriptorOptions } from './file-descriptor.ts';
import { type PackageJsonFile } from './package-json-descriptor.ts';
import type { File } from './types.ts';
type WatchUpdate = {
    duration: number;
    mem: number;
};
export interface Session {
    handleFileChanges(changes: WatchChange[]): Promise<WatchUpdate | undefined>;
    getIssues(): CollectorIssues;
    getResults(): Results;
    describeFile(filePath: string, options?: FileDescriptorOptions): File | undefined;
    describePackageJson(): PackageJsonFile;
}
export declare const createSession: (options: MainOptions) => Promise<Session>;
export {};
