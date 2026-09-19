import parseArgs from '../../util/parse-args.js';
import { toBinary, toDependency } from '../../util/input.js';
import { stripVersionFromSpecifier } from '../../util/modules.js';
import { isInternal } from '../../util/path.js';
import { argsFrom } from '../util.js';
export const resolveX = (words, options) => {
    const { fromArgs } = options;
    const parsed = parseArgs(words, { boolean: ['bun'] });
    const packageSpecifier = parsed._[0];
    const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
    const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
    const command = parsed['shell-mode'] ? fromArgs([parsed['shell-mode']]) : [];
    const isBinary = specifier && !packageSpecifier.includes('@') && !isInternal(specifier);
    const dependency = isBinary ? toBinary(specifier, { optional: true }) : toDependency(specifier, { optional: true });
    const specifiers = specifier ? [dependency] : [];
    return [
        ...specifiers,
        ...packages.map(id => toDependency(id)),
        ...command,
        ...fromArgs(argsFrom(words, packageSpecifier)).slice(1),
    ];
};
export const resolve = (_binary, words, options) => {
    return resolveX(words, options);
};
