import { hasDependency } from '../../util/plugin.js';
import { resolveConfig } from '../vitest/index.js';
import { getBabelInputs, getIndexHtmlEntries } from './helpers.js';
import { createImportMetaGlobVisitor } from './visitors/importMetaGlob.js';
const title = 'Vite';
const enablers = ['vite', 'vitest', 'vite-plus'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];
const resolveFromAST = getBabelInputs;
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createImportMetaGlobVisitor(ctx));
};
const resolve = async (options) => {
    return getIndexHtmlEntries(options.cwd);
};
const args = {
    config: true,
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    resolveFromAST,
    resolve,
    registerVisitors,
    args,
};
export default plugin;
