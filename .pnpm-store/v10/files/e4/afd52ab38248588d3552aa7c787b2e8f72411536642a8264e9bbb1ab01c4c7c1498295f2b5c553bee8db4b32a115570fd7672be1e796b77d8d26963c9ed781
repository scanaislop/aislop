import { hasDependency } from '../../util/plugin.js';
import { config as viteConfig } from '../vite/index.js';
import { resolveFromAST } from './resolveFromAST.js';
const title = 'SvelteKit';
const enablers = ['@sveltejs/kit'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['svelte.config.js', ...viteConfig];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveFromAST,
};
export default plugin;
