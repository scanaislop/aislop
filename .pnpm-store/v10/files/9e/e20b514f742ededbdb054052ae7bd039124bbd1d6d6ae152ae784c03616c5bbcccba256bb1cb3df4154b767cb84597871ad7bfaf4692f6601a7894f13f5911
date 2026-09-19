import parseArgs from '../../util/parse-args.js';
import { toBinary, toDependency } from '../../util/input.js';
import { stripVersionFromSpecifier } from '../../util/modules.js';
import { isInternal } from '../../util/path.js';
import { argsFrom } from '../util.js';
export const resolve = (_binary, words, options) => {
    const { fromArgs } = options;
    const parsed = parseArgs(words, {
        boolean: ['yes', 'no', 'quiet'],
        alias: { yes: 'y', no: 'no-install', package: 'p', call: 'c' },
    });
    const packageSpecifier = parsed._[0];
    const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
    const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
    const command = parsed.call ? fromArgs([parsed.call]) : [];
    const isBinary = specifier && !packageSpecifier.includes('@') && !isInternal(specifier);
    const opts = parsed.no ? undefined : { optional: true };
    const dependency = isBinary ? toBinary(specifier, opts) : toDependency(specifier, opts);
    const specifiers = dependency && !parsed.yes ? [dependency] : [];
    return [
        ...specifiers,
        ...packages.map(id => toDependency(id, { optional: true })),
        ...command,
        ...fromArgs(argsFrom(words, packageSpecifier)).slice(1),
    ];
};
