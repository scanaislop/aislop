import { toEntry, toProductionEntry } from '../../util/input.js';
import { getScriptCommands } from '../../util/scripts.js';
import { createFsPromisesGlobVisitor } from './visitors/fsPromisesGlob.js';
const title = 'Node.js';
const isEnabled = () => true;
const patterns = [
    '**/*{.,-,_}test.{cjs,mjs,js,cts,mts,ts}',
    '**/test-*.{cjs,mjs,js,cts,mts,ts}',
    '**/test.{cjs,mjs,js,cts,mts,ts}',
    '**/test/**/*.{cjs,mjs,js,cts,mts,ts}',
];
const hasNodeTestCache = new WeakMap();
const hasNodeTest = (scripts) => {
    if (!scripts)
        return false;
    const cached = hasNodeTestCache.get(scripts);
    if (cached !== undefined)
        return cached;
    const result = Object.values(scripts).some(script => typeof script === 'string' &&
        getScriptCommands(script).some(({ binary, args }) => (binary === 'node' || binary === 'nub') && args.includes('--test')));
    hasNodeTestCache.set(scripts, result);
    return result;
};
const entry = ['server.js'];
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createFsPromisesGlobVisitor(ctx));
};
const resolve = options => {
    const entries = entry.map(id => toProductionEntry(id));
    if (hasNodeTest(options.manifest.scripts) || hasNodeTest(options.rootManifest?.scripts)) {
        entries.push(...patterns.map(toEntry));
    }
    return entries;
};
const args = {
    positional: true,
    nodeImportArgs: true,
    resolve: ['test-reporter'],
    boolean: [
        'deprecation',
        'experimental-strip-types',
        'experimental-transform-types',
        'harmony',
        'inspect-brk',
        'inspect-wait',
        'inspect',
        'test-only',
        'test',
        'warnings',
        'watch',
    ],
    args: (args) => args.filter(arg => !/--test-reporter[= ](spec|tap|dot|junit|lcov)/.test(arg)),
};
const plugin = {
    title,
    isEnabled,
    entry,
    resolve,
    args,
    registerVisitors,
};
export default plugin;
