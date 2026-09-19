import { hasDependency } from '../../util/plugin.js';
const title = 'Lost Pixel';
const enablers = ['lost-pixel'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['lostpixel.config.{js,ts}'];
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
};
export default plugin;
