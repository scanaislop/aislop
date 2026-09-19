import { hasDependency } from '../../util/plugin.js';
import { toC12config } from '../../util/plugin-config.js';
const title = 'openapi-ts';
const enablers = ['@hey-api/openapi-ts'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', ...toC12config('openapi-ts')];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
};
export default plugin;
