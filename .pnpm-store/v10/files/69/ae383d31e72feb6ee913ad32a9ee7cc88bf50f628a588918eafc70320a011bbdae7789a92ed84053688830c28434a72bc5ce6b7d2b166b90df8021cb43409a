import { hasDependency } from '../../util/plugin.js';
import { getInputs } from '../eslint/helpers.js';
import { getInputsFromFlatConfigAST } from '../eslint/resolveFromAST.js';
const title = 'xo';
const enablers = ['xo'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', '.xo-config', '.xo-config.{js,cjs,json}', 'xo.config.{js,cjs,mjs,ts,cts,mts}'];
const entry = ['.xo-config.{js,cjs}', 'xo.config.{js,cjs,mjs,ts,cts,mts}'];
const isFlatConfig = ({ manifest }) => (manifest.getMajor('xo') ?? 1) >= 1;
const isLoadConfig = options => !isFlatConfig(options);
const resolveConfig = (config, options) => getInputs(config, options);
const resolveFromAST = (program, options) => isFlatConfig(options) ? getInputsFromFlatConfigAST(program) : [];
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    config,
    isLoadConfig,
    resolveConfig,
    resolveFromAST,
};
export default plugin;
