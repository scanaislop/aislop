import { arrayify } from '../../util/array.js';
import { toConfig } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Biome';
const enablers = ['@biomejs/biome'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['biome.json', 'biome.jsonc'];
const isRootConfigReference = (specifier) => specifier === '//';
const resolveExtends = (extendsArray, options) => {
    return extendsArray.map(specifier => {
        if (isRootConfigReference(specifier)) {
            return toConfig('biome', join(options.rootCwd, 'biome'), { containingFilePath: options.configFilePath });
        }
        return toConfig('biome', specifier, { containingFilePath: options.configFilePath });
    });
};
const resolveConfig = (config, options) => {
    return [...resolveExtends(arrayify(config.extends), options)];
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
