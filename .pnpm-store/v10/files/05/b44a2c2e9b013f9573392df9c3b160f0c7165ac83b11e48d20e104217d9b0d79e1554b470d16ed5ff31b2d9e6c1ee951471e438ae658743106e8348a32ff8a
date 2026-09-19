import { toDeferResolveEntry, toDependency } from '../../util/input.js';
import { isInternal } from '../../util/path.js';
export const configFiles = ['karma.conf.js', 'karma.conf.ts', '.config/karma.conf.js', '.config/karma.conf.ts'];
export const inputsFromFrameworks = (frameworks) => frameworks.map(framework => {
    return toDependency(framework === 'jasmine' ? 'jasmine-core' : framework);
});
export const inputsFromPlugins = (plugins, devDependencies) => {
    if (!plugins) {
        const karmaPluginDevDeps = Object.keys(devDependencies ?? {}).filter(name => name.startsWith('karma-'));
        return karmaPluginDevDeps.map(karmaPluginDevDep => toDependency(karmaPluginDevDep));
    }
    return plugins
        .map(plugin => {
        if (typeof plugin !== 'string')
            return;
        return isInternal(plugin) ? toDeferResolveEntry(plugin) : toDependency(plugin);
    })
        .filter((input) => !!input);
};
export const loadConfig = (configFile) => {
    if (typeof configFile !== 'function')
        return;
    const inMemoryConfig = new InMemoryConfig();
    configFile(inMemoryConfig);
    return inMemoryConfig.config ?? {};
};
class InMemoryConfig {
    config;
    set(config) {
        this.config = config;
    }
}
