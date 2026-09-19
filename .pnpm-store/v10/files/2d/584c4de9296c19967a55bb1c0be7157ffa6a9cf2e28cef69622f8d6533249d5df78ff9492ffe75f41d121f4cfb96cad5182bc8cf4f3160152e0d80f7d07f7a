import { compact } from '../../util/array.js';
import { toConfig, toDependency } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { substringBefore } from '../../util/string.js';
const title = 'Nx';
const enablers = ['nx', /^@nrwl\//, /^@nx\//];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['nx.json', 'project.json', '{apps,libs}/**/project.json', 'package.json'];
const findNxDependenciesInNxJson = async (localConfig) => {
    const targetsDefault = localConfig.targetDefaults
        ? Object.keys(localConfig.targetDefaults)
            .filter(it => it.includes(':') && it.startsWith('@'))
            .map(it => substringBefore(it, ':'))
        : [];
    const plugins = localConfig.plugins && Array.isArray(localConfig.plugins)
        ? localConfig.plugins
            .map(value => (typeof value === 'string' ? value : value.plugin))
            .filter(value => value !== undefined)
        : [];
    const generators = localConfig.generators
        ? Object.keys(localConfig.generators)
            .filter(value => value !== undefined)
            .map(value => substringBefore(value, ':'))
        : [];
    return compact([...targetsDefault, ...plugins, ...generators]).map(id => toDependency(id));
};
const resolveConfig = async (localConfig, options) => {
    const { configFileName } = options;
    if (configFileName === 'nx.json') {
        return findNxDependenciesInNxJson(localConfig, options);
    }
    const config = localConfig;
    const targets = config.targets ? Object.values(config.targets) : [];
    const executors = targets
        .map(target => target?.executor)
        .filter(executor => executor && !executor.startsWith('.'))
        .map(executor => executor && substringBefore(executor, ':'));
    const expand = (value) => value.replaceAll('{projectRoot}', options.configFileDir).replaceAll('{workspaceRoot}', options.rootCwd);
    const resolveTargetCwd = (targetCwd) => {
        if (!targetCwd)
            return options.cwd;
        const expanded = expand(targetCwd);
        return expanded === targetCwd ? join(options.cwd, targetCwd) : expanded;
    };
    const inputs = targets
        .filter(target => target.executor === 'nx:run-commands' || target.command)
        .flatMap(target => {
        let commands = [];
        if (target.command)
            commands = [target.command];
        else if (target.options?.command)
            commands = [target.options.command];
        else if (target.options?.commands)
            commands = target.options.commands.map(commandConfig => typeof commandConfig === 'string' ? commandConfig : commandConfig.command);
        return options.getInputsFromScripts(commands.map(expand), { cwd: resolveTargetCwd(target.options?.cwd) });
    });
    const configInputs = targets.flatMap(target => {
        const opts = target.options;
        if (!opts)
            return [];
        const configs = [];
        if ('eslintConfig' in opts && typeof opts.eslintConfig === 'string') {
            configs.push(toConfig('eslint', opts.eslintConfig));
        }
        if ('jestConfig' in opts && typeof opts.jestConfig === 'string') {
            configs.push(toConfig('jest', opts.jestConfig));
        }
        if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
            configs.push(toConfig('typescript', opts.tsConfig));
        }
        if ('vitestConfig' in opts && typeof opts.vitestConfig === 'string') {
            configs.push(toConfig('vitest', opts.vitestConfig));
        }
        if ('webpackConfig' in opts && typeof opts.webpackConfig === 'string') {
            configs.push(toConfig('webpack', opts.webpackConfig));
        }
        return configs;
    });
    return compact([...executors, ...inputs, ...configInputs]).map(id => typeof id === 'string' ? toDependency(id) : id);
};
const args = {
    fromArgs: (parsed) => (parsed._[0] === 'exec' ? [...parsed._.slice(1), ...(parsed['--'] ?? [])] : []),
};
export const docs = {
    note: `Also see [integrated monorepos](/features/integrated-monorepos) and the note regarding internal workspace dependencies.`,
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
