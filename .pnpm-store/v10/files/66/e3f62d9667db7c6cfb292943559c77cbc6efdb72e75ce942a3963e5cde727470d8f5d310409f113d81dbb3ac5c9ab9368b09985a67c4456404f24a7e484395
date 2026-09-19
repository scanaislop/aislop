import { getRuntimeSuccessors } from '../utils.js';
export const findCycles = (graph, filePath, maxDepth = 16) => {
    const cycles = [];
    const visited = new Set();
    const pathSet = new Set([filePath]);
    const path = [filePath];
    const visit = (currentPath) => {
        if (path.length > maxDepth)
            return;
        const node = graph.get(currentPath);
        if (!node)
            return;
        for (const importedPath of getRuntimeSuccessors(node)) {
            if (importedPath === filePath) {
                cycles.push([...path, importedPath]);
                continue;
            }
            if (visited.has(importedPath))
                continue;
            if (!pathSet.has(importedPath)) {
                path.push(importedPath);
                pathSet.add(importedPath);
                visit(importedPath);
                pathSet.delete(importedPath);
                path.pop();
            }
        }
        visited.add(currentPath);
    };
    visit(filePath);
    return cycles;
};
