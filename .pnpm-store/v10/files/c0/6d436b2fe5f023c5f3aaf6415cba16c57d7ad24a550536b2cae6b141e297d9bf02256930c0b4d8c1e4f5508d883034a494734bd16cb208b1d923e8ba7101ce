import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'unbuild';
const enablers = ['unbuild'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['build.config.{js,cjs,mjs,ts,mts,cts,json}'];
const resolveConfig = config => {
    return [config]
        .flat()
        .map(obj => obj.entries)
        .flatMap(entries => entries?.map(entry => (typeof entry === 'string' ? entry : entry.input)) ?? [])
        .map(id => toEntry(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
