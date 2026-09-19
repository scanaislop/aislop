import { getPackageNameFromModuleSpecifier } from '../../util/modules.js';
export const getDependencyUsage = (graph, pattern) => {
    const result = new Map();
    const isMatch = (packageName, binaryName) => {
        if (!pattern)
            return true;
        if (typeof pattern === 'string')
            return packageName === pattern || binaryName === pattern;
        return pattern.test(packageName) || (binaryName !== undefined && pattern.test(binaryName));
    };
    const addEntry = (packageName, filePath, specifier, binaryName, pos, line, col) => {
        let entry = result.get(packageName);
        if (!entry) {
            entry = { packageName, imports: [] };
            result.set(packageName, entry);
        }
        entry.imports.push({ filePath, specifier, binaryName, pos, line, col });
    };
    for (const [filePath, file] of graph) {
        if (file.imports?.external) {
            for (const _import of file.imports.external) {
                const packageName = getPackageNameFromModuleSpecifier(_import.specifier);
                if (packageName && isMatch(packageName)) {
                    addEntry(packageName, filePath, _import.specifier, undefined, _import.pos, _import.line, _import.col);
                }
            }
        }
        if (file.imports?.externalRefs) {
            for (const ref of file.imports.externalRefs) {
                const packageName = getPackageNameFromModuleSpecifier(ref.specifier);
                if (packageName && isMatch(packageName, ref.identifier)) {
                    addEntry(packageName, filePath, ref.specifier, ref.identifier, undefined, undefined, undefined);
                }
            }
        }
    }
    return result;
};
