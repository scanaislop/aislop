import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Hardhat';
const enablers = ['hardhat'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['hardhat.config.{js,cjs,mjs,ts,cts,mts}'];
const resolve = async () => {
    return [toDependency('hardhat')];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    resolve,
};
export default plugin;
