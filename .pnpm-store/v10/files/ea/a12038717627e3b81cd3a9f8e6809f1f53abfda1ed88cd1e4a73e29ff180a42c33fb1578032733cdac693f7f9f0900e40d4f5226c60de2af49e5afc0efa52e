import { findCallArg, getFirstPropertyValue, getPropertyValues } from '../../typescript/ast-helpers.js';
import { toEntry, toIgnore, toProductionEntry } from '../../util/input.js';
export const entry = ['src/entry.dev.tsx'];
export const production = ['src/root.tsx', 'src/entry.*.tsx'];
export const routeProduction = ['src/routes/**/*.{tsx,ts,md,mdx}'];
const getSrcDir = (program) => {
    const arg = findCallArg(program, 'qwikVite');
    return (arg && getFirstPropertyValue(arg, 'srcDir')) ?? 'src';
};
const getRoutesDirs = (program, srcDir) => {
    const arg = findCallArg(program, 'qwikCity');
    if (arg) {
        const values = Array.from(getPropertyValues(arg, 'routesDir')).filter(Boolean);
        if (values.length > 0)
            return values;
    }
    return [`${srcDir}/routes`];
};
export const resolveFromAST = program => {
    const srcDir = getSrcDir(program);
    const routesDirs = getRoutesDirs(program, srcDir);
    const setSrcDir = (pattern) => pattern.replace(/^src\//, `${srcDir}/`);
    const setRoutesDir = (pattern, routesDir) => pattern.replace(/^src\/routes\//, `${routesDir}/`);
    const routeEntries = [];
    for (const routesDir of routesDirs) {
        for (const pattern of routeProduction) {
            routeEntries.push(toProductionEntry(setRoutesDir(pattern, routesDir)));
        }
    }
    return [
        ...entry.map(setSrcDir).map(path => toEntry(path)),
        ...production.map(setSrcDir).map(path => toProductionEntry(path)),
        ...routeEntries,
        toIgnore('@qwik-city-plan', 'unlisted'),
        toIgnore('@qwik-city-sw-register', 'unlisted'),
        toIgnore('@qwik-client-manifest', 'unlisted'),
    ];
};
