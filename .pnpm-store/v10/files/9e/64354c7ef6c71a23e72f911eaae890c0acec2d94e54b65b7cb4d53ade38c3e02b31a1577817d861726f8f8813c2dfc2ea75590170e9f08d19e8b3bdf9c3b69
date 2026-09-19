import { collectPropertyValues } from '../../typescript/ast-helpers.js';
import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'esbuild';
const enablers = ['esbuild'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['esbuild.config.{js,mjs,cjs,ts,mts,cts}', 'esbuild.{js,mjs,cjs,ts,mts,cts}'];
const resolveFromAST = (program, { configFileDir }) => Array.from(collectPropertyValues(program, 'entryPoints'), id => toProductionEntry(join(configFileDir, id)));
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
