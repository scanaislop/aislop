import { hasDependency } from '../../util/plugin.js';
import { tsAutoImportCompiler, vueAutoImportCompiler } from '../_vue/auto-import.js';
const title = 'unplugin-auto-import';
const enablers = ['unplugin-auto-import'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerCompilers = ({ hasDependency, registerCompiler }) => {
    if (hasDependency('unplugin-auto-import')) {
        registerCompiler({ extension: '.vue', compiler: vueAutoImportCompiler });
        registerCompiler({ extension: '.ts', compiler: tsAutoImportCompiler });
    }
};
const plugin = {
    title,
    enablers,
    isEnabled,
    registerCompilers,
};
export default plugin;
