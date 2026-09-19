import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { vueAutoImportCompiler } from '../_vue/auto-import.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
const title = 'Vue';
const enablers = ['vue'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['vue.config.{js,ts,mjs}'];
const resolveConfig = async (config, options) => {
    const { manifest } = options;
    const inputs = [];
    if (config.configureWebpack) {
        const baseConfig = {
            mode: 'development',
            entry: {},
            resolve: {},
            plugins: [],
            module: { rules: [] },
        };
        const modifiedConfig = typeof config.configureWebpack === 'function' ? config.configureWebpack(baseConfig) : config.configureWebpack;
        const inputsFromConfig = await findWebpackDependenciesFromConfig(modifiedConfig ?? baseConfig, options);
        for (const input of inputsFromConfig)
            inputs.push(input);
    }
    if (manifest.scripts &&
        Object.values(manifest.scripts).some(script => /(?<=^|\s)vue-cli-service(\s|\s.+\s)lint(?=\s|$)/.test(script))) {
        inputs.push(toDependency('@vue/cli-plugin-eslint'));
    }
    return inputs;
};
const sfcCompilers = ['vue', 'nuxt', 'unplugin-vue', '@vitejs/plugin-vue'];
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    if (sfcCompilers.some(hasDependency)) {
        registerCompiler({ extension: '.vue', compiler: vueAutoImportCompiler });
    }
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    registerCompilers,
};
export default plugin;
