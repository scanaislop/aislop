import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Nest';
const enablers = [/^@nestjs\/.*/];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['nest-cli.json', '.nestcli.json', '.nest-cli.json', 'nest.json'];
const resolveConfig = async (config) => {
    const inputs = config?.collection ? [config.collection] : [];
    return Array.from(inputs, id => toDependency(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
