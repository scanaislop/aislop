import { c as AgentCommands, b as AgentCommandValue, R as ResolvedCommand, A as Agent, C as Command } from './shared/package-manager-detector.44nIG8rR.mjs';

/**
 * Split `run` arguments around the script name for package managers that
 * require `--` to forward extra arguments to the script (npm, pnpm@6).
 *
 * The script name is the first positional argument that is neither a flag
 * nor the value of a preceding value-taking flag (e.g. `-w <workspace>`).
 * Everything before it (workspace/filter flags) stays in front; everything
 * after it is the script's own arguments.
 *
 * @param args The arguments passed after the `run` command.
 * @param valueFlags Flags that consume the following argument as their value.
 * @returns The args split into `before` the script, the `script` itself
 * (or `undefined` when there is no script name), and the `after` args.
 */
declare function splitRunArgs(args: string[], valueFlags?: string[]): {
    before: string[];
    script: string | undefined;
    after: string[];
};
declare const COMMANDS: {
    npm: AgentCommands;
    yarn: AgentCommands;
    'yarn@berry': AgentCommands;
    pnpm: AgentCommands;
    'pnpm@6': AgentCommands;
    'pnpm-rush': AgentCommands;
    bun: AgentCommands;
    aube: AgentCommands;
    deno: AgentCommands;
    nub: AgentCommands;
};
/**
 * Resolve the command for the agent merging the command arguments with the provided arguments.
 *
 * For example, to show how to install `@antfu/ni` globally using `pnpm`:
 * ```js
 * import { resolveCommand } from 'package-manager-detector/commands'
 * const { command, args } = resolveCommand('pnpm', 'global', ['@antfu/ni'])
 * console.log(`${command} ${args.join(' ')}`) // 'pnpm add -g @antfu/ni'
 * ```
 *
 * @param agent The agent to use.
 * @param command the command to resolve.
 * @param args The arguments to pass to the command.
 * @returns {ResolvedCommand} The resolved command or `null` if the agent command is not found.
 */
declare function resolveCommand(agent: Agent, command: Command, args: string[]): ResolvedCommand | null;
/**
 * Construct the command from the agent command merging the command arguments with the provided arguments.
 * @param value {AgentCommandValue} The agent command to use.
 * @param args The arguments to pass to the command.
 * @returns {ResolvedCommand} The resolved command or `null` if the command is `null`.
 */
declare function constructCommand(value: AgentCommandValue, args: string[]): ResolvedCommand | null;

export { COMMANDS, constructCommand, resolveCommand, splitRunArgs };
