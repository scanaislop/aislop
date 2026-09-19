import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'CSpell';
const enablers = ['cspell'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = [
    'cspell.config.{js,cjs,mjs,ts,mts,json,yaml,yml}',
    'cspell.{json,yaml,yml}',
    '.c{s,S}pell.json',
    'c{s,S}pell.json',
];
const resolveConfig = config => {
    return [config?.import ?? []].flat().map(id => toDeferResolve(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
