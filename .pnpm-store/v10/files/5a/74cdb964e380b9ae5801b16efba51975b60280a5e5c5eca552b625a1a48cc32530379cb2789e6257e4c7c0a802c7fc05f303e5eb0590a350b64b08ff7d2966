import MDX from '../../compilers/mdx.js';
import { hasDependency } from '../../util/plugin.js';
import { config } from '../vite/index.js';
import { entry, production, resolveFromAST, routeProduction } from './resolveFromAST.js';
const title = 'Qwik';
const enablers = ['@builder.io/qwik'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    if (hasDependency('@builder.io/qwik-city')) {
        registerCompiler({ extension: '.mdx', compiler: MDX.compiler });
    }
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    production: [...production, ...routeProduction],
    registerCompilers,
    resolveFromAST,
};
export default plugin;
