import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Drizzle';
const enablers = ['drizzle-kit'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['drizzle.config.{ts,js,json}'];
const resolveConfig = config => {
    if (!config.schema)
        return [];
    return [config.schema].flat().map(id => toProductionEntry(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
