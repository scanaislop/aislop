import { toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Cucumber';
const enablers = ['@cucumber/cucumber'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['cucumber.{json,yaml,yml,js,cjs,mjs}'];
const entry = ['features/**/*.@(js|cjs|mjs)'];
const resolveConfig = config => {
    const imports = (config?.import ? config.import : entry).map(id => toEntry(id));
    const formatters = config?.format ? config.format : [];
    const requires = config?.require ? config.require : [];
    return imports.concat([...formatters, ...requires].map(id => toDeferResolve(id)));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveConfig,
};
export default plugin;
