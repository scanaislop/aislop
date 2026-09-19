import { argsFrom } from '../../binaries/util.js';
const title = 'c8';
const args = {
    args: (args) => args.filter(arg => arg !== 'check-coverage'),
    boolean: ['all', 'check-coverage', 'clean', 'exclude-after-remap', 'per-file', 'skip-full'],
    fromArgs: (parsed, args) => (parsed._[0] ? argsFrom(args, parsed._[0]) : (parsed['--'] ?? [])),
};
const plugin = {
    title,
    args,
};
export default plugin;
