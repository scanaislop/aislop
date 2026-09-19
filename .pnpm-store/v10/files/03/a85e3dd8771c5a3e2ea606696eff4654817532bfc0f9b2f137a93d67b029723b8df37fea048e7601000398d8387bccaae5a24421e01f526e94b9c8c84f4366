import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Convex';
const enablers = ['convex'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['convex.json'];
const production = ['convex/**/*.@(js|ts)'];
const resolveConfig = localConfig => {
    const functionsDir = typeof localConfig.functions === 'string' ? localConfig.functions : 'convex';
    return [toProductionEntry(join(functionsDir, '**/*.@(js|ts)'))];
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
