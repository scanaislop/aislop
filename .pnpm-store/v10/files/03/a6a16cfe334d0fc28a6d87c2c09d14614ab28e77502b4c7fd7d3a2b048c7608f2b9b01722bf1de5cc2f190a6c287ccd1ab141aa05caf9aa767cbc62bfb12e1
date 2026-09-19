import { hasDependency } from '../../util/plugin.js';
import { markdownAutoImportCompiler } from '../_vue/auto-import.js';
const title = 'unplugin-vue-markdown';
const enablers = ['unplugin-vue-markdown'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerCompilers = ({ hasDependency, registerCompiler }) => {
    if (hasDependency('unplugin-vue-markdown'))
        registerCompiler({ extension: '.md', compiler: markdownAutoImportCompiler });
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerCompilers,
};
export default plugin;
