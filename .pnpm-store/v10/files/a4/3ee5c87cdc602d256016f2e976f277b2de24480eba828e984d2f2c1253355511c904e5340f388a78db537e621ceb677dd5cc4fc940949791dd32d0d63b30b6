import parseArgs from '../../util/parse-args.js';
import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Relay';
const enablers = ['vite-plugin-relay', '@swc/plugin-relay', 'babel-plugin-relay'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['relay.config.json', 'relay.config.js'];
const resolveConfig = async (config) => {
    const projects = 'projects' in config ? Object.values(config.projects) : [config];
    return projects.map(project => {
        const artifactDirectory = project.artifactDirectory;
        if (artifactDirectory == null) {
            return toProductionEntry('**/__generated__/*');
        }
        return toProductionEntry(join(artifactDirectory, '**'));
    });
};
const args = {
    binaries: ['relay-compiler'],
    args: (args) => ['-c', parseArgs(args)._[0]],
    config: true,
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
