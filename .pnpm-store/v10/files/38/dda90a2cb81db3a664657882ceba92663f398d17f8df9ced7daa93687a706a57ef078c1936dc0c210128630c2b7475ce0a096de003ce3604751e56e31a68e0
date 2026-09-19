import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import compiler from './compiler.js';
import mdxCompiler from './compiler-mdx.js';
import { entry, production, resolveFromAST } from './resolveFromAST.js';
const title = 'Astro';
const enablers = ['astro'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
export const config = ['astro.config.{js,cjs,mjs,ts,mts}'];
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    if (hasDependency('astro'))
        registerCompiler({ extension: '.astro', compiler });
    if (hasDependency('@astrojs/mdx') || hasDependency('@astrojs/starlight')) {
        registerCompiler({ extension: '.mdx', compiler: mdxCompiler });
    }
};
const resolve = options => {
    const { manifest, isProduction } = options;
    const inputs = [];
    if (!isProduction &&
        manifest.scripts &&
        Object.values(manifest.scripts).some(script => /(?<=^|\s)astro(\s|\s.+\s)check(?=\s|$)/.test(script))) {
        inputs.push(toDependency('@astrojs/check'));
    }
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    production,
    registerCompilers,
    resolveFromAST,
    resolve,
};
export default plugin;
