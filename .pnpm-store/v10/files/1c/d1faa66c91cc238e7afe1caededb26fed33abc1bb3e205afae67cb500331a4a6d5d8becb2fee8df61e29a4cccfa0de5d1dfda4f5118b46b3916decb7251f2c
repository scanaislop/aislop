import { hasDependency } from '../../util/plugin.js';
import { vueAutoImportCompiler } from '../_vue/auto-import.js';
const title = 'unplugin-vue-components';
const enablers = ['unplugin-vue-components'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerCompilers = ({ hasDependency, registerCompiler }) => {
    if (hasDependency('unplugin-vue-components'))
        registerCompiler({ extension: '.vue', compiler: vueAutoImportCompiler });
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerCompilers,
};
export default plugin;
