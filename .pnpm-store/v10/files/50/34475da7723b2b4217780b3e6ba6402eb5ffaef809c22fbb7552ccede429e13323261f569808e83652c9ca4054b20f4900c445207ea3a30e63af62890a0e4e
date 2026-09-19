import { createGraphExplorer } from '../graph-explorer/explorer.js';
export const buildPackageJsonDescriptor = (graph, entryPaths) => {
    const explorer = createGraphExplorer(graph, entryPaths);
    return {
        dependenciesUsage: explorer.getDependencyUsage(),
    };
};
