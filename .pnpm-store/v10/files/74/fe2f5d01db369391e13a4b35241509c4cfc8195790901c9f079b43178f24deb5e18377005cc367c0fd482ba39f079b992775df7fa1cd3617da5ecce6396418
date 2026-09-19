const toConfigMap = (defaultExtensions, builderConfig) => (moduleName, options) => {
    const config = {
        rcPrefix: '.',
        rcSuffix: 'rc',
        configDir: true,
        configFiles: true,
        configFilesAllExtensions: false,
        additionalExtensions: [],
        ...builderConfig,
        ...options,
    };
    const { rcPrefix, rcSuffix } = config;
    const jsTypeExtensions = ['js', 'ts', 'cjs', 'mjs', 'cts', 'mts'];
    const extensions = [...defaultExtensions, ...config.additionalExtensions];
    const baseFiles = [
        `${rcPrefix}${moduleName}${rcSuffix}`,
        ...(config.configDir ? [`.config/${moduleName}${rcSuffix}`] : []),
    ];
    const rcFiles = `${rcPrefix}${moduleName}${rcSuffix}.{${extensions.join(',')}}`;
    const configExtensions = extensions.filter(ext => config.configFilesAllExtensions || jsTypeExtensions.includes(ext));
    const configFiles = config.configFiles ? [`${moduleName}.config.{${configExtensions.join(',')}}`] : [];
    const configDirFiles = config.configDir ? [`.config/${moduleName}${rcSuffix}.{${extensions.join(',')}}`] : [];
    return [...baseFiles, rcFiles, ...configFiles, ...configDirFiles];
};
export const toCosmiconfig = toConfigMap(['json', 'yaml', 'yml', 'js', 'ts', 'cjs', 'mjs'], { configDir: true });
export const toLilconfig = toConfigMap(['json', 'ts', 'js', 'cjs', 'mjs'], { configDir: true });
export const toUnconfig = toConfigMap(['json', 'ts', 'mts', 'cts', 'js', 'mjs', 'cjs'], {
    configDir: false,
    rcPrefix: '',
    rcSuffix: '',
    configFiles: false,
});
export const toC12config = toConfigMap(['json', 'jsonc', 'json5', 'yaml', 'yml', 'js', 'ts', 'mjs', 'cjs', 'mts', 'cts', 'toml'], { configDir: true });
