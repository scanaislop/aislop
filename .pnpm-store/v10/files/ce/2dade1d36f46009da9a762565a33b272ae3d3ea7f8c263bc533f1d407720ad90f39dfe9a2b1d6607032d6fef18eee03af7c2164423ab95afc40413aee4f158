import { hasDependency } from '../../util/plugin.js';
import { config as viteConfig } from '../vite/index.js';
import compiler from './compiler.js';
const title = 'Svelte';
const enablers = ['svelte'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['svelte.config.js', ...viteConfig];
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    if (hasDependency('svelte'))
        registerCompiler({ extension: '.svelte', compiler });
};
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    registerCompilers,
};
export default plugin;
