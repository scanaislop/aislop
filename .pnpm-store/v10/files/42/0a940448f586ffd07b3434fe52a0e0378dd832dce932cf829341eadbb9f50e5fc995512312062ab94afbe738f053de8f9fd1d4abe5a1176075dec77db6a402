import { toDependency, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { extractFunctionsConfigProperty } from './helpers.js';
const title = 'Netlify';
const enablers = [/^@netlify\/plugin-/, 'netlify-cli', '@netlify/functions'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['netlify.toml'];
const NETLIFY_FUNCTIONS_DIR = 'netlify/functions';
const NETLIFY_FUNCTIONS_EXTS = 'js,mjs,cjs,ts,mts,cts';
const production = [`${NETLIFY_FUNCTIONS_DIR}/**/*.{${NETLIFY_FUNCTIONS_EXTS}}`];
const resolveConfig = async (localConfig) => {
    return [
        ...extractFunctionsConfigProperty(localConfig.functions || {}, 'included_files'),
        join(localConfig.functions?.directory ?? NETLIFY_FUNCTIONS_DIR, `**/*.{${NETLIFY_FUNCTIONS_EXTS}}`),
    ]
        .filter(file => !file.startsWith('!'))
        .map(id => toProductionEntry(id))
        .concat([
        ...(localConfig?.plugins?.map(plugin => plugin.package) ?? []).map(id => toDependency(id)),
        ...extractFunctionsConfigProperty(localConfig.functions || {}, 'external_node_modules').map(id => toDependency(id)),
    ]);
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveConfig,
};
export default plugin;
