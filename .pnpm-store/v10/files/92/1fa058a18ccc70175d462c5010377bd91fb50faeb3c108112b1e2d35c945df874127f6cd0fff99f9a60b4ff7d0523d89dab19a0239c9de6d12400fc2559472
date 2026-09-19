import { hasDependency } from '../../util/plugin.js';
const title = 'Remix';
const enablers = [/^@remix-run\//];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['remix.config.js', 'remix.init/index.js'];
const production = [
    'app/root.tsx',
    'app/entry.{client,server}.{js,jsx,ts,tsx}',
    'app/routes/**/*.{js,ts,tsx}',
    'server.{js,ts}',
];
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    production,
};
export default plugin;
