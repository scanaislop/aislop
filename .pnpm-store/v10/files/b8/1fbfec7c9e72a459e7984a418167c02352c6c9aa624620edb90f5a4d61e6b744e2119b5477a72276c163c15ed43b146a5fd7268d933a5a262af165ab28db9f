import MDX from '../../compilers/mdx.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Fumadocs';
const enablers = ['fumadocs-core', 'fumadocs-mdx', 'fumadocs-ui'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['source.config.{js,ts,mjs}', 'content/**/*.mdx'];
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    if (hasDependency('fumadocs-mdx'))
        registerCompiler({ extension: '.mdx', compiler: MDX.compiler });
};
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    registerCompilers,
};
export default plugin;
