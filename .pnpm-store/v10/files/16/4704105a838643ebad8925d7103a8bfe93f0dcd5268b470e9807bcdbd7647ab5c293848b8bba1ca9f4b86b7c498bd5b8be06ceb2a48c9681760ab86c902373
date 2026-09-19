import { toDependency, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { clientToPackages } from './helpers.js';
import { createKnexClientVisitor } from './visitors/clientCall.js';
const title = 'Knex';
const enablers = ['knex'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['knexfile.{js,cjs,mjs,ts,cts,mts}'];
const processKnexConfig = (config) => {
    const inputs = [];
    if (config.client) {
        const packages = clientToPackages(config.client);
        inputs.push(...packages.map(pkg => toDependency(pkg, { optional: true })));
    }
    if (config.migrations?.directory) {
        const dirs = Array.isArray(config.migrations.directory)
            ? config.migrations.directory
            : [config.migrations.directory];
        inputs.push(...dirs.map(dir => toEntry(`${dir}/*.{js,ts}`)));
    }
    if (config.seeds?.directory) {
        const dirs = Array.isArray(config.seeds.directory) ? config.seeds.directory : [config.seeds.directory];
        inputs.push(...dirs.map(dir => toEntry(`${dir}/*.{js,ts}`)));
    }
    return inputs;
};
const resolveConfig = config => {
    const configs = 'client' in config && config.client ? [config] : Object.values(config);
    return configs.flatMap(cfg => (typeof cfg === 'object' && cfg !== null ? processKnexConfig(cfg) : []));
};
const registerVisitors = ({ ctx, registerVisitor }) => {
    registerVisitor(createKnexClientVisitor(ctx));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    registerVisitors,
};
export default plugin;
