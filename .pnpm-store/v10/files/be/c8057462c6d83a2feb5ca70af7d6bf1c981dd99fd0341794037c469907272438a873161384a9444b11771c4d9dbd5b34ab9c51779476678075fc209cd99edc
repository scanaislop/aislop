import parseArgs from '../../util/parse-args.js';
import { getCatalogReference } from '../../util/catalog.js';
import { toCatalog, toDependency } from '../../util/input.js';
import { stripVersionFromSpecifier } from '../../util/modules.js';
const toDependencyInputs = (packageSpecifier) => {
    const dependency = toDependency(stripVersionFromSpecifier(packageSpecifier), { optional: true });
    const reference = getCatalogReference(packageSpecifier);
    return reference ? [dependency, toCatalog(reference.packageName, reference.catalogName)] : [dependency];
};
export const resolveDlx = (words, options) => {
    const parsed = parseArgs(words, {
        boolean: ['silent'],
        alias: { package: 'p', 'shell-mode': 'c' },
    });
    const packageSpecifier = parsed._[0];
    const packages = parsed.package && !parsed.yes ? [parsed.package].flat() : [];
    const command = parsed['shell-mode'] ? options.fromArgs([parsed['shell-mode']]) : [];
    const dependencyInputs = packageSpecifier ? toDependencyInputs(packageSpecifier) : [];
    return [...dependencyInputs, ...packages.flatMap(toDependencyInputs), ...command];
};
export const resolve = (_binary, words, options) => {
    return resolveDlx(words, options);
};
