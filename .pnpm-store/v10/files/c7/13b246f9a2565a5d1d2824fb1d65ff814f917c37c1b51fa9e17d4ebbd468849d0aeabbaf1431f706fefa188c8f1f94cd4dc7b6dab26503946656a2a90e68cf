import { toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Rstest';
const enablers = ['@rstest/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['rstest.config.{js,cjs,mjs,ts,cts,mts}'];
const mocks = ['**/__mocks__/**/*.?(c|m)[jt]s?(x)'];
const entry = ['**/*.{test,spec}.?(c|m)[jt]s?(x)'];
function testEnvironment(config) {
    if (!config.testEnvironment || config.testEnvironment === 'node')
        return [];
    return [config.testEnvironment];
}
const resolveConfig = async (config) => {
    const entries = (config.include ?? entry)
        .concat(...mocks)
        .map(toEntry)
        .concat(...(config.exclude ?? []).map(id => toEntry(`!${id}`)));
    const environments = testEnvironment(config);
    const setupFiles = config.setupFiles ?? [];
    return [...environments, ...setupFiles, ...entries].map(id => (typeof id === 'string' ? toDeferResolve(id) : id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
