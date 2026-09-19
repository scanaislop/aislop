import parseArgs from '../util/parse-args.js';
import { pluginArgsMap } from '../plugins.js';
import { compact } from '../util/array.js';
import { toBinary, toConfig, toDeferResolve, toDeferResolveEntry, toEntry } from '../util/input.js';
import { extractBinary } from '../util/modules.js';
import { dirname } from '../util/path.js';
import { resolve as fallbackResolve } from './fallback.js';
import { toWordArgs } from './util.js';
const isGlobLikeMatch = /(^!|[*+\\(|{^$])/;
const isGlobLike = (value) => isGlobLikeMatch.test(value);
const nodeLoadersArgs = { import: ['r', 'experimental-loader', 'require', 'loader'] };
export const resolve = (binary, words, options) => {
    const { cwd, fromArgs, containingFilePath, manifest } = options;
    const [pluginName, pluginArgs] = pluginArgsMap.get(binary) ?? [];
    if (!pluginArgs)
        return fallbackResolve(binary, words, options);
    const inputOpts = {};
    if (cwd && dirname(containingFilePath) !== cwd)
        Object.assign(inputOpts, { dir: cwd });
    const values = [];
    for (const word of words)
        values.push(word.value);
    const args = typeof pluginArgs.args === 'function' ? pluginArgs.args(values) : values;
    const parsed = parseArgs(args, {
        string: [
            ...(pluginArgs.nodeImportArgs ? ['import'] : []),
            ...(pluginArgs.config === true ? ['config'] : []),
            ...(pluginArgs.string ?? []),
        ],
        boolean: ['quiet', 'verbose', 'watch', ...(pluginArgs.boolean ?? [])],
        alias: {
            ...(pluginArgs.nodeImportArgs ? nodeLoadersArgs : {}),
            ...(pluginArgs.config === true ? { config: ['c'] } : {}),
            ...pluginArgs.alias,
        },
        '--': true,
    });
    const positionals = [];
    if (pluginArgs.positional && parsed._[0]) {
        const id = parsed._[0];
        if (isGlobLike(id))
            positionals.push(toEntry(id));
        else {
            if (id.includes('node_modules/.bin/'))
                positionals.push(toBinary(extractBinary(id)));
            else
                positionals.push(toDeferResolveEntry(id, { optional: true }));
        }
    }
    const mapToParsedKey = (id) => parsed[id];
    const resolved = compact(pluginArgs.resolve ? pluginArgs.resolve.flatMap(mapToParsedKey) : []);
    const resolvedImports = pluginArgs.nodeImportArgs && parsed.import ? [parsed.import].flat() : [];
    const resolvedFromArgs = typeof pluginArgs.fromArgs === 'function'
        ? fromArgs(toWordArgs(pluginArgs.fromArgs(parsed, args), words))
        : Array.isArray(pluginArgs.fromArgs)
            ? fromArgs(pluginArgs.fromArgs.flatMap(mapToParsedKey).filter(Boolean))
            : [];
    const config = pluginArgs.config === true ? ['config'] : pluginArgs.config || [];
    const mapToConfigPattern = (value) => {
        if (typeof value === 'string')
            return parsed[value] && pluginName ? [toConfig(pluginName, parsed[value], inputOpts)] : [];
        const [id, fn] = value;
        return parsed[id] && pluginName ? [toConfig(pluginName, fn(parsed[id]), inputOpts)] : [];
    };
    const configFilePaths = config.flatMap(mapToConfigPattern);
    const inputs = pluginArgs.resolveInputs?.(parsed, { args, cwd, manifest }) ?? [];
    return [
        toBinary(binary, inputOpts),
        ...positionals,
        ...resolved.map(id => toDeferResolve(id)),
        ...resolvedImports.map(id => toDeferResolve(id)),
        ...resolvedFromArgs,
        ...configFilePaths,
        ...inputs,
    ];
};
