import { isAbsolute, join } from '../../util/path.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Lunaria';
const enablers = ['@lunariajs/core', '@lunariajs/starlight'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['lunaria.config.json'];
const resolveConfig = async (localConfig, options) => {
    if (!localConfig)
        return [];
    const files = localConfig.files?.map(f => f.location) ?? [];
    const renderer = localConfig.renderer ? [localConfig.renderer] : [];
    const customCss = localConfig.dashboard?.customCss ?? [];
    const favicon = localConfig.dashboard?.favicon?.inline ? [localConfig.dashboard.favicon.inline] : [];
    const baseDir = options.configFileDir;
    return [...files, ...renderer, ...customCss, ...favicon].map(id => toProductionEntry(isAbsolute(id) ? id : join(baseDir, id)));
};
const args = {
    binaries: ['lunaria'],
    config: ['config'],
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
    args,
};
export default plugin;
