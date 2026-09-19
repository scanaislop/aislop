import { hasDependency } from '../../util/plugin.js';
const title = 'Vercel OG';
const enablers = ['next', '@vercel/og'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const production = [
    '{src/,}pages/api/og.{jsx,tsx}',
    '{src/,}app/api/og/route.{jsx,tsx}',
];
const plugin = {
    title,
    enablers,
    isEnabled,
    production,
};
export default plugin;
