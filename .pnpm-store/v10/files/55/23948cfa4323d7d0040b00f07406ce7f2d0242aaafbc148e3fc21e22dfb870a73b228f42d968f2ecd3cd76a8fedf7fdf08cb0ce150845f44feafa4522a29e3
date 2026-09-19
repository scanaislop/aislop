import { isFile } from '../../util/fs.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Capacitor';
const enablers = [/^@capacitor\//];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['capacitor.config.{json,ts}'];
const resolveConfig = async (config, { configFileDir }) => {
    const plugins = config.includePlugins ?? [];
    const android = isFile(configFileDir, 'android/capacitor.settings.gradle') ? ['@capacitor/android'] : [];
    const hasIOS = isFile(configFileDir, 'ios/App/Podfile') || isFile(configFileDir, 'ios/App/CapApp-SPM/Package.swift');
    const ios = hasIOS ? ['@capacitor/ios'] : [];
    return [...plugins, ...android, ...ios].map(id => toDependency(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
