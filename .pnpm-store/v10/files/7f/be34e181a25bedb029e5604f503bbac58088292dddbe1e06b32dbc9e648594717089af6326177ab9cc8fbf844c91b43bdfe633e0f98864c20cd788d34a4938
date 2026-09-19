import { toDeferResolve, toDependency } from '../../util/input.js';
import { isInternal } from '../../util/path.js';
const getCandidates = (prefix, identifier) => {
    if (isInternal(identifier))
        return [identifier];
    if (identifier.startsWith('@')) {
        const [scope, name, ...rest] = identifier.split('/');
        if (rest.length > 0)
            return [identifier];
        if (scope) {
            if (!name)
                return [[scope, prefix].join('/')];
            if (name.startsWith(prefix))
                return [identifier];
            return [[scope, prefix + name].join('/'), identifier];
        }
    }
    const [name, ...rest] = identifier.split('/');
    if (rest.length > 0)
        return [identifier];
    if (name.startsWith(prefix))
        return [identifier];
    return [prefix + name, name];
};
const getDeclaredDependencies = (manifest) => new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
]);
const pickCandidate = (prefix, identifier, manifest) => {
    const candidates = getCandidates(prefix, identifier);
    if (candidates.length === 1 || isInternal(candidates[0]))
        return candidates[0];
    const dependencies = getDeclaredDependencies(manifest);
    return candidates.find(candidate => dependencies.has(candidate)) ?? candidates[0];
};
export const resolveLoadPluginStylePluginName = (prefix, identifier, manifest) => {
    prefix = prefix + (prefix.at(-1) === '-' ? '' : '-');
    const candidate = pickCandidate(prefix, identifier, manifest);
    return isInternal(candidate) ? toDeferResolve(candidate) : toDependency(candidate);
};
