import { argsFrom } from '../../binaries/util.js';
const title = 'dotenv';
const args = {
    fromArgs: (parsed, args) => (parsed._[0] ? argsFrom(args, parsed._[0]) : (parsed['--'] ?? [])),
};
const plugin = {
    title,
    args,
};
export default plugin;
