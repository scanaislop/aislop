import { toDependency, toProductionDependency } from '../../util/input.js';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.js';
import { join } from '../../util/path.js';
const getDummyConfigContext = (options) => ({
    projectRoot: options.cwd,
    staticConfigPath: null,
    packageJsonPath: join(options.cwd, 'package.json'),
    config: {
        plugins: [],
    },
});
export const getConfig = (localConfig, options) => {
    const expoConfig = typeof localConfig === 'function' ? localConfig(getDummyConfigContext(options)) : localConfig;
    return 'expo' in expoConfig ? expoConfig.expo : expoConfig;
};
export const getDependencies = async (localConfig, options) => {
    const { manifest } = options;
    const config = getConfig(localConfig, options);
    const platforms = config.platforms ?? ['ios', 'android'];
    const pluginPackages = config.plugins
        ?.map(plugin => {
        const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
        return getPackageNameFromModuleSpecifier(pluginName);
    })
        .filter(Boolean) ?? [];
    const inputs = new Set(pluginPackages.map(id => toDependency(id)));
    const allowedPackages = ['expo-atlas', 'expo-dev-client'];
    const allowedProductionPackages = ['expo-insights'];
    const manifestDependencies = Object.keys(manifest.dependencies ?? {});
    for (const pkg of allowedPackages) {
        if (manifestDependencies.includes(pkg)) {
            inputs.add(toDependency(pkg));
        }
    }
    for (const pkg of allowedProductionPackages) {
        if (manifestDependencies.includes(pkg)) {
            inputs.add(toProductionDependency(pkg));
        }
    }
    if (config.updates?.enabled !== false) {
        inputs.add(toProductionDependency('expo-updates'));
    }
    if (config.notification) {
        inputs.add(toProductionDependency('expo-notifications'));
    }
    const isExpoRouter = manifest.main === 'expo-router/entry';
    if (isExpoRouter) {
        inputs.add(toProductionDependency('expo-router'));
    }
    if (platforms.includes('web')) {
        inputs.add(toProductionDependency('react-native-web'));
        inputs.add(toProductionDependency('react-dom'));
        if (!isExpoRouter) {
            inputs.add(toDependency('@expo/metro-runtime'));
        }
    }
    if ((platforms.includes('android') && (config.userInterfaceStyle || config.android?.userInterfaceStyle)) ||
        (platforms.includes('ios') && (config.backgroundColor || config.ios?.backgroundColor))) {
        inputs.add(toProductionDependency('expo-system-ui'));
    }
    if (platforms.includes('android') && config.androidNavigationBar) {
        inputs.add(toProductionDependency('expo-navigation-bar'));
    }
    return [...inputs];
};
