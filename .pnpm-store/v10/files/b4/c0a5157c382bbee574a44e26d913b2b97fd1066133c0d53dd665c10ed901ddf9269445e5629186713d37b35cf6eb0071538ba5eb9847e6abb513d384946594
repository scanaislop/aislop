import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'React Native';
const enablers = ['react-native'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['react-native.config.js'];
const RN_CLI_PACKAGES = [
    '@react-native-community/cli',
    '@react-native-community/cli-platform-android',
    '@react-native-community/cli-platform-ios',
];
const resolveConfig = async (config) => {
    const inputs = [];
    if (config.dependencies) {
        for (const name of Object.keys(config.dependencies)) {
            inputs.push(toDependency(name));
        }
    }
    if (config.platforms) {
        for (const platform of Object.values(config.platforms)) {
            if (platform.npmPackageName)
                inputs.push(toDependency(platform.npmPackageName));
        }
    }
    return inputs;
};
const resolve = () => {
    return RN_CLI_PACKAGES.map(pkg => toDependency(pkg, { optional: true }));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    resolve,
};
export default plugin;
