import { getRuntimeSuccessors } from '../utils.js';
const UNVISITED = undefined;
const ON_STACK = 1;
const DONE = 2;
export const findAllCycles = (graph, ignoredFlags) => {
    const cycles = [];
    const state = new Map();
    for (const root of graph.keys()) {
        if (state.get(root) !== UNVISITED)
            continue;
        const path = [];
        const indexOnPath = new Map();
        const successorsStack = [];
        const push = (filePath) => {
            state.set(filePath, ON_STACK);
            indexOnPath.set(filePath, path.length);
            path.push(filePath);
            const node = graph.get(filePath);
            successorsStack.push((node ? getRuntimeSuccessors(node, ignoredFlags) : new Set()).values());
        };
        push(root);
        while (path.length > 0) {
            const current = path[path.length - 1];
            const next = successorsStack[successorsStack.length - 1].next();
            if (next.done) {
                state.set(current, DONE);
                indexOnPath.delete(current);
                path.pop();
                successorsStack.pop();
                continue;
            }
            const successor = next.value;
            const successorState = state.get(successor);
            if (successorState === ON_STACK) {
                cycles.push([...path.slice(indexOnPath.get(successor)), successor]);
            }
            else if (successorState === UNVISITED) {
                push(successor);
            }
        }
    }
    return cycles;
};
