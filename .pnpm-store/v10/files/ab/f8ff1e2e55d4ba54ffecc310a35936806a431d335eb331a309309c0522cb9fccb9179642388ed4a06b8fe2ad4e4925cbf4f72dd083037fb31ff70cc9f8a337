import { ISSUE_TYPES } from '../constants.js';
import { ConfigurationError } from './errors.js';
export const defaultExcludedIssueTypes = ['nsExports', 'nsTypes', 'cycles'];
const defaultAddOnIssueTypes = ['nsExports', 'nsTypes'];
const defaultIssueTypes = ISSUE_TYPES.filter(type => !defaultExcludedIssueTypes.includes(type));
const normalize = (values) => values.flatMap(value => value.split(','));
export const shorthandDeps = ['dependencies', 'unlisted', 'binaries', 'unresolved', 'catalog', 'catalogReferences'];
export const shorthandExports = ['exports', 'types', 'enumMembers', 'namespaceMembers', 'duplicates'];
export const shorthandFiles = ['files'];
export const shorthandCycles = ['cycles'];
export const getIncludedIssueTypes = (options) => {
    const incl = normalize(options.includeOverrides ?? []);
    const excl = normalize(options.excludeOverrides ?? []);
    for (const type of [...incl, ...excl, ...options.include, ...options.exclude]) {
        if (!ISSUE_TYPES.includes(type))
            throw new ConfigurationError(`Invalid issue type: ${type}`);
    }
    const excludes = options.exclude.filter(exclude => !incl.includes(exclude));
    const includes = options.include.filter(include => !excl.includes(include));
    const _include = [...incl, ...includes];
    const _exclude = [...excl, ...excludes];
    if (options.isProduction) {
        _exclude.push('devDependencies');
        _exclude.push('catalog');
        _exclude.push('catalogReferences');
    }
    else {
        if (_include.includes('dependencies'))
            _include.push('devDependencies', 'optionalPeerDependencies');
        if (_exclude.includes('dependencies'))
            _exclude.push('devDependencies', 'optionalPeerDependencies');
    }
    const included = (_include.length > 0
        ? _include.some(type => !defaultAddOnIssueTypes.includes(type))
            ? _include
            : [..._include, ...defaultIssueTypes]
        : defaultIssueTypes).filter(group => !_exclude.includes(group));
    return Object.fromEntries(ISSUE_TYPES.map(group => [group, included.includes(group)]));
};
