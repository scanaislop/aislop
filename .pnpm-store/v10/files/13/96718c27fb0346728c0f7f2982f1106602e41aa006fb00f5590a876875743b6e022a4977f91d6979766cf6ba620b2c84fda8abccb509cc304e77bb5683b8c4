import { parse } from 'unbash';
import { extractBinary } from './modules.js';
const spawningBinaries = new Set(['c8', 'cross-env', 'retry-cli']);
export const toShellCommand = (argv) => argv.map(arg => `'${arg.replaceAll("'", `'\\''`)}'`).join(' ');
export function* walkCommands(node) {
    switch (node.type) {
        case 'Command':
            yield node;
            break;
        case 'AndOr':
        case 'Pipeline':
            for (const command of node.commands)
                yield* walkCommands(command);
            break;
        case 'If':
            for (const statement of node.clause.commands)
                yield* walkCommands(statement.command);
            for (const statement of node.then.commands)
                yield* walkCommands(statement.command);
            if (node.else)
                yield* walkCommands(node.else);
            break;
        case 'While':
            for (const statement of node.clause.commands)
                yield* walkCommands(statement.command);
            for (const statement of node.body.commands)
                yield* walkCommands(statement.command);
            break;
        case 'For':
        case 'Select':
        case 'Subshell':
        case 'BraceGroup':
            for (const statement of node.body.commands)
                yield* walkCommands(statement.command);
            break;
        case 'CompoundList':
            for (const statement of node.commands)
                yield* walkCommands(statement.command);
            break;
        case 'Function':
        case 'Coproc':
            yield* walkCommands(node.body);
            break;
        case 'Statement':
            yield* walkCommands(node.command);
            break;
    }
}
export const getScriptCommands = (script) => {
    if (!script)
        return [];
    let parsed;
    try {
        parsed = parse(script);
    }
    catch {
        return [];
    }
    if (!parsed.commands)
        return [];
    const out = [];
    for (const statement of parsed.commands) {
        for (const node of walkCommands(statement.command)) {
            const text = node.name?.value;
            if (!text)
                continue;
            const binary = extractBinary(text);
            if (spawningBinaries.has(binary)) {
                const rest = node.suffix
                    .filter(word => word.text !== '--')
                    .map(word => word.text)
                    .join(' ');
                out.push(...getScriptCommands(rest));
            }
            else
                out.push({ binary, args: node.suffix.map(word => word.value) });
        }
    }
    return out;
};
