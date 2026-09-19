import { parse } from 'unbash';
import { Plugins, pluginArgsMap } from '../plugins.js';
import { debugLogObject } from '../util/debug.js';
import { toBinary, toDeferResolve } from '../util/input.js';
import { extractBinary, isValidBinary } from '../util/modules.js';
import { relative } from '../util/path.js';
import { substringBefore, truncate } from '../util/string.js';
import { walkCommands } from '../util/scripts.js';
import { resolve as fallbackResolve } from './fallback.js';
import KnownResolvers from './resolvers/index.js';
import { resolve as resolverFromPlugins } from './plugins.js';
import { parseNodeArgs } from './util.js';
const spawningBinaries = ['cross-env', 'retry-cli'];
const collectExpansionScripts = (word, out) => {
    if (!word.parts)
        return;
    for (const part of word.parts) {
        if ((part.type === 'CommandExpansion' || part.type === 'ProcessSubstitution') && part.script) {
            out.push(part.script);
        }
        else if (part.type === 'DoubleQuoted' || part.type === 'LocaleString') {
            for (const child of part.parts) {
                if (child.type === 'CommandExpansion' && child.script)
                    out.push(child.script);
            }
        }
    }
};
export const getDependenciesFromScript = (script, options) => {
    if (!script)
        return [];
    const fromArgs = (args, opts) => {
        if (args.length === 0)
            return [];
        const first = typeof args[0] === 'string' ? args[0] : args[0].value;
        if (!isValidBinary(substringBefore(first, ' ')))
            return [];
        const parts = [];
        for (const arg of args) {
            if (typeof arg === 'string') {
                if (arg !== '--')
                    parts.push(arg);
            }
            else if (arg.value !== '--')
                parts.push(arg.text);
        }
        return getDependenciesFromScript(parts.join(' '), {
            ...options,
            knownBinsOnly: false,
            ...opts,
        });
    };
    const definedFunctions = new Set();
    const collectFunctionNames = (statements) => {
        for (const stmt of statements)
            if (stmt.command.type === 'Function')
                definedFunctions.add(stmt.command.name.text);
    };
    const processScript = (s) => {
        collectFunctionNames(s.commands);
        const pending = [];
        const mainDeps = [];
        for (const statement of s.commands) {
            for (const command of walkCommands(statement.command))
                mainDeps.push(...processCommand(command, pending));
        }
        const expansionDeps = pending.flatMap(inner => processScript(inner));
        return [...mainDeps, ...expansionDeps];
    };
    const processCommand = (node, pending) => {
        const text = node.name?.value;
        const binary = text ? extractBinary(text) : text;
        if (node.name)
            collectExpansionScripts(node.name, pending);
        for (const prefix of node.prefix)
            if (prefix.value)
                collectExpansionScripts(prefix.value, pending);
        for (const suffix of node.suffix)
            collectExpansionScripts(suffix, pending);
        if (!binary || binary === '.' || binary === 'source' || binary === '[')
            return [];
        if (binary.startsWith('-') || binary.startsWith('..'))
            return [];
        if (definedFunctions.has(binary))
            return [];
        const words = node.suffix;
        if (binary === '!' || binary === 'test')
            return fromArgs(words);
        const fromNodeOptions = node.prefix
            .filter(a => a.name === 'NODE_OPTIONS' && a.value)
            .map(a => a.value.value)
            .map(arg => parseNodeArgs(arg.split(' ')))
            .filter(args => args.require)
            .flatMap(arg => arg.require)
            .map(id => toDeferResolve(id));
        if (binary in KnownResolvers) {
            const resolver = KnownResolvers[binary];
            return resolver(binary, words, { ...options, fromArgs });
        }
        if (pluginArgsMap.has(binary)) {
            return [...resolverFromPlugins(binary, words, { ...options, fromArgs }), ...fromNodeOptions];
        }
        if (spawningBinaries.includes(binary)) {
            const rest = node.suffix
                .filter(w => w.text !== '--')
                .map(w => w.text)
                .join(' ');
            return [toBinary(binary), ...getDependenciesFromScript(rest, options)];
        }
        if (binary in Plugins) {
            const inputs = fallbackResolve(binary, words, { ...options, fromArgs });
            if (options.knownBinsOnly)
                for (const input of inputs)
                    input.optional = true;
            return [...inputs, ...fromNodeOptions];
        }
        if (options.knownBinsOnly && !text?.startsWith('.'))
            return [];
        return [...fallbackResolve(binary, words, { ...options, fromArgs }), ...fromNodeOptions];
    };
    try {
        const parsed = parse(script);
        if (!parsed.commands)
            return [];
        return processScript(parsed);
    }
    catch (error) {
        const msg = `Warning: failed to parse and ignoring script in ${relative(options.cwd, options.containingFilePath)} (${truncate(script, 30)})`;
        debugLogObject('*', msg, error);
        return [];
    }
};
