import parseArgs from '../../util/parse-args.js';
import { argsAfter, expandScript } from '../util.js';
export const resolve = (_binary, words, options) => {
    const { fromArgs, manifest } = options;
    const parsed = parseArgs(words, { '--': true });
    const [command, script] = parsed._;
    const _childArgs = parsed['--'] && parsed['--'].length > 0 ? fromArgs(argsAfter(words, '--'), { knownBinsOnly: true }) : [];
    if (command === 'exec')
        return _childArgs;
    if (command === 'run' && manifest.scriptNames.has(script)) {
        return expandScript(script, argsAfter(words, '--'), manifest.scripts, options) ?? _childArgs;
    }
    return [];
};
