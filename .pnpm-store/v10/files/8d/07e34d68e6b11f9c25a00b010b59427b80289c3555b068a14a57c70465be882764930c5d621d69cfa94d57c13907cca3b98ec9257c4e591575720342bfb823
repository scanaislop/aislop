import { toProductionEntry } from '../../util/input.js';
import { isAbsolute, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getHtmlScriptEntries } from '../vite/helpers.js';
const title = 'electron-vite';
const enablers = ['electron-vite'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['electron.vite.config.{js,mjs,cjs,ts,mts,cts}'];
const defaultEntry = {
    main: 'src/main/index.{js,mjs,cjs,ts,mts,cts}',
    preload: 'src/preload/index.{js,mjs,cjs,ts,mts,cts}',
    renderer: 'src/renderer/index.html',
};
const production = Object.values(defaultEntry);
const buildEnv = { command: 'build', mode: 'production' };
const resolveConfig = async (localConfig, options) => {
    const { configFileDir } = options;
    const config = typeof localConfig === 'function' ? await localConfig(buildEnv) : localConfig;
    const inputs = [];
    for (const name of ['main', 'preload', 'renderer']) {
        let section = config?.[name];
        if (typeof section === 'function')
            section = await section(buildEnv);
        const ids = [];
        for (const input of [section?.build?.rollupOptions?.input, section?.build?.lib?.entry]) {
            if (typeof input === 'string')
                ids.push(input);
            else if (input)
                ids.push(...Object.values(input));
        }
        const patterns = ids.length > 0 ? ids : [defaultEntry[name]];
        for (const id of patterns) {
            const resolved = isAbsolute(id) ? id : join(configFileDir, id);
            inputs.push(toProductionEntry(resolved));
            if (name === 'renderer' && resolved.endsWith('.html')) {
                for (const input of await getHtmlScriptEntries(resolved))
                    inputs.push(input);
            }
        }
    }
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveConfig,
};
export default plugin;
