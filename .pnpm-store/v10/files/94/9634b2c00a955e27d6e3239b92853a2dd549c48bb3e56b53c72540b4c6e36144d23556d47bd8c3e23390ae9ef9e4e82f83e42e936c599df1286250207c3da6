import { toConfig, toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Stryker';
const enablers = ['@stryker-mutator/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['?(.)stryker.{conf,config}.{js,mjs,cjs,json}'];
const resolveConfig = localConfig => {
    const runners = localConfig.testRunner ? [`@stryker-mutator/${localConfig.testRunner}-runner`] : [];
    const checkers = localConfig.checkers
        ? localConfig.checkers.map(checker => `@stryker-mutator/${checker}-checker`)
        : [];
    const plugins = localConfig.plugins ?? [];
    return [...runners, ...checkers, ...plugins].map(id => toDeferResolve(id));
};
const args = {
    boolean: ['allowEmpty', 'disableBail', 'dryRunOnly', 'force', 'ignoreStatic', 'incremental', 'inPlace'],
    resolveInputs: parsed => (parsed._[0] === 'run' && parsed._[1] ? [toConfig('stryker', parsed._[1])] : []),
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    args,
};
export default plugin;
