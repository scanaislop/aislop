import { hasDependency } from '../../util/plugin.js';
const title = 'Nano Staged';
const enablers = ['nano-staged'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = [
    'package.json',
    '.nano-staged.{js,cjs,mjs,json}',
    'nano-staged.{js,cjs,mjs,json}',
    '.nanostagedrc',
];
const resolveConfig = async (config, options) => {
    if (options.isProduction)
        return [];
    if (typeof config === 'function')
        config = config();
    if (!config)
        return [];
    const inputs = new Set();
    for (const entry of Object.values(config).flat()) {
        const api = { filenames: ['./example.js'] };
        const scripts = [typeof entry === 'function' ? await entry(api) : entry].flat();
        for (const id of options.getInputsFromScripts(scripts))
            inputs.add(id);
    }
    return Array.from(inputs);
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
