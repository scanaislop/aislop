export const extractFunctionsConfigProperty = (config, property) => [
    ...(config[property] ?? []),
    ...Object.values(config).filter(x => typeof x === 'object' && property in x).flatMap(x => x[property] || []),
];
