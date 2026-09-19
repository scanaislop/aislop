import { isInternal, toAbsolute } from '../../util/path.js';
import { load } from '../../util/plugin.js';
export const resolveDependencies = async (config, options) => {
    const { configFileDir } = options;
    const reporters = new Set();
    for (const scope of [config, config.e2e, config.component]) {
        const reporter = scope?.reporter;
        if (!reporter)
            continue;
        reporters.add(reporter);
        if (reporter === 'cypress-multi-reporters' && scope?.reporterOptions?.configFile) {
            const configFilePath = toAbsolute(scope.reporterOptions.configFile, configFileDir);
            if (isInternal(configFilePath)) {
                const reporterConfig = await load(configFilePath);
                if (typeof reporterConfig === 'object' && reporterConfig.reporterEnabled) {
                    for (const name of reporterConfig.reporterEnabled.split(','))
                        reporters.add(name.trim());
                }
            }
        }
    }
    return [...reporters];
};
