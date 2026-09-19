import { hasDependency } from '../../util/plugin.js';
const title = 'eve';
const enablers = ['eve'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const extensions = '{js,jsx,ts,tsx,mjs,cjs,mts,cts}';
const rootAgentFileNames = '{agent,instructions,instrumentation,sandbox}';
const subagentFileNames = '{agent,instructions,sandbox}';
const production = [
    `{,agent/}${rootAgentFileNames}.${extensions}`,
    `{,agent/}sandbox/sandbox.${extensions}`,
    `{,agent/}{channels,connections,hooks,skills,tools,schedules}/**/*.${extensions}`,
    `{,agent/}subagents/**/${subagentFileNames}.${extensions}`,
    `{,agent/}subagents/**/sandbox/sandbox.${extensions}`,
    `{,agent/}subagents/**/{connections,hooks,skills,tools}/**/*.${extensions}`,
];
const plugin = {
    title,
    enablers,
    isEnabled,
    production,
};
export default plugin;
