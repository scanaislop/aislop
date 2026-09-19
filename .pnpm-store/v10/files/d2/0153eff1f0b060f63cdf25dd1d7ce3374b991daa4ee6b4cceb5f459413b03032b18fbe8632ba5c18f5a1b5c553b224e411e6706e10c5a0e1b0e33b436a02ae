import { collectPropertyValues } from '../../typescript/ast-helpers.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Rslib';
const enablers = ['@rslib/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['rslib*.config.{mjs,ts,js,cjs,mts,cts}'];
const resolveFromAST = program => Array.from(collectPropertyValues(program, 'entry'), id => toProductionEntry(id, { allowIncludeExports: true }));
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
