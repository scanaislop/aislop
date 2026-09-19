import { toAlias } from '../../util/input.js';
import { join, toPosix } from '../../util/path.js';
const environments = {
    node: null,
    jsdom: null,
    'happy-dom': null,
    'edge-runtime': null,
};
const envPackageNames = {
    jsdom: 'jsdom',
    'happy-dom': 'happy-dom',
    'edge-runtime': '@edge-runtime/vm',
};
export const getEnvSpecifier = (env) => {
    if (env in envPackageNames)
        return envPackageNames[env];
    return `vitest-environment-${env}`;
};
const builtInReporters = [
    'agent',
    'basic',
    'blob',
    'default',
    'dot',
    'github-actions',
    'hanging-process',
    'html',
    'json',
    'junit',
    'minimal',
    'tap',
    'tap-flat',
    'tree',
    'verbose',
];
const addStar = (value) => (value.endsWith('*') ? value : join(value, '*').replace(/\/\*\*$/, '/*'));
export const getAliasInputs = (aliasOptions, cwd) => {
    const inputs = [];
    for (const [alias, value] of Object.entries(aliasOptions)) {
        if (!value)
            continue;
        const prefixes = [value]
            .flat()
            .filter((value) => typeof value === 'string')
            .map(prefix => (toPosix(prefix).startsWith(cwd) ? prefix : join(cwd, prefix)));
        if (alias.length > 1)
            inputs.push(toAlias(alias, prefixes));
        inputs.push(toAlias(addStar(alias), prefixes.map(addStar)));
    }
    return inputs;
};
export const getExternalReporters = (reporters) => reporters
    ? [reporters]
        .flat()
        .map(reporter => (Array.isArray(reporter) ? reporter[0] : reporter))
        .filter((reporter) => typeof reporter === 'string' && !builtInReporters.includes(reporter))
    : [];
