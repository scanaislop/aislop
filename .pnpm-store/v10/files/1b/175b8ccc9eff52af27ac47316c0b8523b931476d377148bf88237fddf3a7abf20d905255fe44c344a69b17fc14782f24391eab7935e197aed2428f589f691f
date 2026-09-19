import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'tsx';
const enablers = ['tsx'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const packageJsonPath = (id) => id;
const resolveConfig = localConfig => {
    const scripts = localConfig.scripts;
    const entries = [];
    if (scripts && Object.values(scripts).some(script => /(?<=^|\s)tsx\s(.*)--test/.test(script))) {
        const patterns = [
            '**/*{.,-,_}test.?(c|m)(j|t)s',
            '**/test-*.?(c|m)(j|t)s',
            '**/test.?(c|m)(j|t)s',
            '**/test/**/*.?(c|m)(j|t)s',
        ];
        entries.push(...patterns.map(id => toEntry(id)));
    }
    return entries;
};
const args = {
    positional: true,
    nodeImportArgs: true,
    args: (args) => args.filter(arg => arg !== 'watch'),
};
const plugin = {
    title,
    isEnabled,
    packageJsonPath,
    config,
    resolveConfig,
    args,
};
export default plugin;
