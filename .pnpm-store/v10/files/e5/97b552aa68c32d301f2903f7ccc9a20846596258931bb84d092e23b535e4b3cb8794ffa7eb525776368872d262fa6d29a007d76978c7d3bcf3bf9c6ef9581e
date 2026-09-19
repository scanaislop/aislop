import type { ConfigurationChief, Workspace } from '../ConfigurationChief.ts';
import type { DependencyDeputy } from '../DependencyDeputy.ts';
import type { Issue } from '../types/issues.ts';
import type { ExternalRef } from '../types/module-graph.ts';
import type { MainOptions } from './create-options.ts';
import { type Input } from './input.ts';
export type ExternalRefsFromInputs = Map<string, Set<ExternalRef>>;
export declare const createInputHandler: (deputy: DependencyDeputy, chief: ConfigurationChief, isGitIgnored: (filePath: string) => boolean, addIssue: (issue: Issue) => void, externalRefs: ExternalRefsFromInputs | undefined, options: MainOptions) => (input: Input, workspace: Workspace) => string | undefined;
