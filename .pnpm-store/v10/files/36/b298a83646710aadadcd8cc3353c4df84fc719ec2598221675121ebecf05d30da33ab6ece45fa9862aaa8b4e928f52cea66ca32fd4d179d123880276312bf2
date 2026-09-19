import { compact } from '../../util/array.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Raycast';
const enablers = ['@raycast/api'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const packageJsonPath = (manifest) => manifest;
const mapEntries = (items, directory) => {
    const names = compact((items ?? []).map(item => (typeof item.name === 'string' ? item.name : undefined)));
    return names.map(name => toProductionEntry(`${directory}${name}.{js,jsx,ts,tsx}`));
};
const resolveConfig = async (manifest) => [
    ...mapEntries(manifest.commands, 'src/'),
    ...mapEntries(manifest.tools, 'src/tools/'),
];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    packageJsonPath,
    resolveConfig,
};
export default plugin;
