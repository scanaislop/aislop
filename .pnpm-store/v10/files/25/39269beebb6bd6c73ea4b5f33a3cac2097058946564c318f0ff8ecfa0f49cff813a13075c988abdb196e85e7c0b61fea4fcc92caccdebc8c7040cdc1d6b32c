import { collectPropertyValues } from '../../typescript/ast-helpers.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Rollup';
const enablers = ['rollup'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['rollup.config.{js,cjs,mjs,ts}'];
const args = {
    alias: { plugin: ['p'] },
    string: ['config'],
    config: ['config'],
    args: (args) => args
        .filter((arg, index) => !(arg === '--config' && (args[index + 1] === undefined || args[index + 1].startsWith('-'))))
        .map(arg => (arg.startsWith('--watch.onEnd') ? `--_exec${arg.slice(13)}` : arg)),
    fromArgs: ['_exec'],
    resolve: ['plugin', 'configPlugin'],
};
const resolveFromAST = program => Array.from(collectPropertyValues(program, 'input'), id => toProductionEntry(id));
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    args,
    resolveFromAST,
};
export default plugin;
