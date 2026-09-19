import { collectPropertyValues } from '../../typescript/ast-helpers.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Rolldown';
const enablers = ['rolldown'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['rolldown.config.{js,cjs,mjs,ts,cts,mts}'];
const resolveFromAST = program => Array.from(collectPropertyValues(program, 'input'), id => toProductionEntry(id));
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
