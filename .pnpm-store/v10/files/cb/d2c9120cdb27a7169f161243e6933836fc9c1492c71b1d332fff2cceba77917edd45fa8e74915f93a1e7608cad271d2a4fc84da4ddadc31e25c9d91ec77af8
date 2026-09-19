import { hasDependency } from '../../util/plugin.js';
import { production, resolveFromAST } from './resolveFromAST.js';
const title = 'Next.js MDX';
const enablers = ['@next/mdx'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['next.config.{js,ts,cjs,mjs,mts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveFromAST,
};
export default plugin;
