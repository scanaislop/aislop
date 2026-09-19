import { toEntry } from '../../util/input.js';
import { isInternal } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'pm2';
const enablers = ['pm2'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['pm2.config.{json,js,cjs,mjs}', 'ecosystem.config.{json,js,cjs,mjs}'];
const addApplicationEntry = (application, entries) => {
    if (application.script && isInternal(application.script))
        entries.push(toEntry(application.script));
};
const resolveConfig = config => {
    const entries = [];
    if (Array.isArray(config)) {
        for (const application of config)
            addApplicationEntry(application, entries);
        return entries;
    }
    addApplicationEntry(config, entries);
    if (!config.apps)
        return entries;
    const applications = Array.isArray(config.apps) ? config.apps : [config.apps];
    for (const application of applications)
        addApplicationEntry(application, entries);
    return entries;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
