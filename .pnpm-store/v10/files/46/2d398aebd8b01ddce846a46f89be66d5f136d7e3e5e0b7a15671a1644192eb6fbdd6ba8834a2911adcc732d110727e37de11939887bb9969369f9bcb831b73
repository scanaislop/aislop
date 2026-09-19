import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'tsd';
const enablers = ['tsd'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const entry = ['*.test-d.{ts,tsx}', 'test-d/**/*.test-d.{ts,tsx}'];
const resolveConfig = async (localConfig) => {
    const inputs = [];
    if (localConfig?.testFiles)
        for (const id of localConfig.testFiles)
            inputs.push(toEntry(id));
    if (localConfig?.directory) {
        inputs.push(toEntry('*.test-d.{ts,tsx}'));
        inputs.push(toEntry(`${localConfig.directory}/**/*.test-d.{ts,tsx}`));
    }
    if (inputs.length === 0)
        for (const id of entry)
            inputs.push(toEntry(id));
    return inputs;
};
const args = {
    alias: { files: ['f'], typings: ['t'] },
    string: ['files', 'typings'],
    resolveInputs: (parsed) => {
        const inputs = [];
        for (const id of [parsed.files ?? []].flat())
            inputs.push(toEntry(String(id)));
        if (typeof parsed._[0] === 'string')
            inputs.push(toEntry(`${parsed._[0]}/**/*.test-d.{ts,tsx}`));
        return inputs;
    },
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveConfig,
    args,
};
export default plugin;
