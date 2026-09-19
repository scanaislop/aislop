import { toDeferResolve, toEntry } from '../../util/input.js';
import { isDirectory } from '../../util/fs.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Mocha';
const enablers = ['mocha'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];
const entry = ['**/test/*.{js,cjs,mjs}'];
const defaultExtensions = ['js', 'cjs', 'mjs'];
const resolveConfig = localConfig => {
    const entryPatterns = localConfig.spec ? [localConfig.spec].flat() : entry;
    const require = localConfig.require ? [localConfig.require].flat() : [];
    const inputs = [];
    inputs.push(...entryPatterns.map(id => toEntry(id)));
    inputs.push(...require.map(id => toDeferResolve(id)));
    return inputs;
};
const args = {
    nodeImportArgs: true,
    boolean: [
        'allow-uncaught',
        'async-only',
        'bail',
        'check-leaks',
        'colors',
        'delay',
        'diff',
        'dry-run',
        'exit',
        'forbid-only',
        'forbid-pending',
        'inline-diffs',
        'invert',
        'parallel',
        'recursive',
        'sort',
        'watch',
    ],
    alias: {
        'async-only': ['A'],
        bail: ['b'],
        colors: ['c'],
        fgrep: ['f'],
        grep: ['g'],
        invert: ['i'],
        jobs: ['j'],
        'node-option': ['n'],
        parallel: ['p'],
        reporter: ['R'],
        'reporter-option': ['O'],
        slow: ['s'],
        sort: ['S'],
        timeout: ['t'],
        ui: ['u'],
        watch: ['w'],
    },
    string: ['config', 'extension', 'fgrep', 'file', 'grep', 'ignore', 'package', 'reporter', 'spec', 'ui'],
    config: ['config'],
    resolveInputs: (parsed, { cwd }) => {
        const extensions = [parsed.extension ?? []]
            .flat()
            .flatMap(value => String(value).split(','))
            .map(extension => extension.replace(/^\./, ''));
        const list = extensions.length > 0 ? extensions : defaultExtensions;
        const suffix = list.length === 1 ? `*.${list[0]}` : `*.{${list.join(',')}}`;
        const inputs = [];
        for (const value of [...parsed._, ...[parsed.spec ?? []].flat(), ...[parsed.file ?? []].flat()].map(String)) {
            if (isDirectory(cwd, value))
                inputs.push(toEntry(`${value.replace(/\/$/, '')}/${parsed.recursive ? '**/' : ''}${suffix}`));
            else
                inputs.push(toEntry(value));
        }
        for (const value of [parsed.ignore ?? []].flat())
            inputs.push(toEntry(`!${String(value)}`));
        return inputs;
    },
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveConfig,
    args,
};
export default plugin;
