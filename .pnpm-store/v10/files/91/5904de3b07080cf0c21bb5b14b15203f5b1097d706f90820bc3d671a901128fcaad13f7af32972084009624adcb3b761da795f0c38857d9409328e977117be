import { isAbsolute, toRelative } from './path.js';
export const fromBinary = (input) => input.specifier;
export const toBinary = (specifier, options = {}) => ({
    type: 'binary',
    specifier,
    ...options,
});
export const isBinary = (input) => input.type === 'binary';
export const toCatalog = (specifier, catalogName) => ({
    type: 'catalog',
    specifier,
    catalogName,
});
export const isCatalog = (input) => input.type === 'catalog';
export const toEntry = (specifier) => ({ type: 'entry', specifier });
export const isEntry = (input) => input.type === 'entry' && !input.production;
export const toProject = (specifier) => ({ type: 'project', specifier });
export const isProject = (input) => input.type === 'project';
export const toProductionEntry = (specifier, options = {}) => ({
    type: 'entry',
    specifier,
    production: true,
    ...options,
});
export const isProductionEntry = (input) => input.type === 'entry' && input.production === true;
export const toConfig = (pluginName, specifier, options = {}) => ({
    type: 'config',
    specifier,
    pluginName,
    ...options,
});
export const isConfig = (input) => input.type === 'config';
export const toDependency = (specifier, options = {}) => ({
    type: 'dependency',
    specifier,
    ...options,
});
export const isDependency = (input) => input.type === 'dependency';
export const toProductionDependency = (specifier) => ({
    type: 'dependency',
    specifier,
    production: true,
});
export const toDeferResolve = (specifier, options = {}) => ({
    type: 'deferResolve',
    specifier,
    ...options,
});
export const isDeferResolve = (input) => input.type === 'deferResolve';
export const toDeferResolveProductionEntry = (specifier, options = {}) => ({
    type: 'deferResolveEntry',
    specifier,
    production: true,
    ...options,
});
export const isDeferResolveProductionEntry = (input) => input.type === 'deferResolveEntry' && input.production === true;
export const toDeferResolveEntry = (specifier, options = {}) => ({
    type: 'deferResolveEntry',
    specifier,
    ...options,
});
export const isDeferResolveEntry = (input) => input.type === 'deferResolveEntry';
export const toAlias = (specifier, prefix, options = {}) => ({
    type: 'alias',
    specifier,
    prefixes: Array.isArray(prefix) ? prefix : [prefix],
    ...options,
});
export const isAlias = (input) => input.type === 'alias';
export const toIgnore = (specifier, issueType) => ({
    type: 'ignore',
    specifier,
    issueType,
});
export const isIgnore = (input) => input.type === 'ignore';
export const toDebugString = (input, cwd) => `${input.type}:${isAbsolute(input.specifier) ? toRelative(input.specifier, cwd) : input.specifier}${input.containingFilePath ? ` (${toRelative(input.containingFilePath, cwd)})` : ''}`;
