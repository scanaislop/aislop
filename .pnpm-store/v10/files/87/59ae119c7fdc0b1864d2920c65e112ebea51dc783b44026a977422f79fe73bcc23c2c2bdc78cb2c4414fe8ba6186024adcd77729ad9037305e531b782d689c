import parseArgs from '../util/parse-args.js';
const valueOf = (arg) => (typeof arg === 'string' ? arg : arg.value);
export const argsFrom = (args, from) => args.slice(args.findIndex(arg => valueOf(arg) === from));
export const argsAfter = (args, token) => {
    const index = args.findIndex(arg => valueOf(arg) === token);
    return index === -1 ? [] : args.slice(index + 1).filter(arg => valueOf(arg) !== '--');
};
export const toWordArgs = (values, words) => {
    const args = [];
    let cursor = 0;
    for (const value of values) {
        const str = String(value);
        let match = -1;
        for (let index = cursor; index < words.length; index++) {
            if (words[index].value === str) {
                match = index;
                break;
            }
        }
        if (match === -1)
            args.push(str);
        else {
            args.push(words[match]);
            cursor = match + 1;
        }
    }
    return args;
};
export const expandScript = (name, forwardedArgs, scripts, options, opts = {}) => {
    const source = scripts?.[name];
    if (!source || forwardedArgs.length === 0)
        return;
    const expandedScripts = options.expandedScripts ?? new Set();
    if (expandedScripts.has(name))
        return;
    expandedScripts.add(name);
    return options.fromArgs([source, ...forwardedArgs], { ...opts, expandedScripts });
};
export const parseNodeArgs = (args) => parseArgs(args, {
    string: ['r'],
    alias: { require: ['r', 'loader', 'experimental-loader', 'test-reporter', 'watch', 'import'] },
});
