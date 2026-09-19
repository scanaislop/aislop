export function graphSequencer(graph, includedNodes = [...graph.keys()]) {
    const reverseGraph = new Map();
    for (const key of graph.keys()) {
        reverseGraph.set(key, []);
    }
    const nodes = new Set(includedNodes);
    const visited = new Set();
    const outDegree = new Map();
    for (const [from, edges] of graph) {
        outDegree.set(from, 0);
        for (const to of edges) {
            if (nodes.has(from) && nodes.has(to)) {
                changeOutDegree(from, 1);
                reverseGraph.get(to).push(from);
            }
        }
        if (!nodes.has(from)) {
            visited.add(from);
        }
    }
    const chunks = [];
    const cycles = [];
    let safe = true;
    while (nodes.size) {
        const chunk = [];
        let minDegree = Number.MAX_SAFE_INTEGER;
        for (const node of nodes) {
            const degree = outDegree.get(node);
            if (degree === 0) {
                chunk.push(node);
            }
            minDegree = Math.min(minDegree, degree);
        }
        if (minDegree === 0) {
            chunk.forEach(removeNode);
            chunks.push(chunk);
        }
        else {
            const cycleNodes = [];
            for (const node of nodes) {
                const cycle = findCycle(node);
                if (cycle.length) {
                    cycles.push(cycle);
                    cycle.forEach(removeNode);
                    cycleNodes.push(...cycle);
                    if (cycle.length > 1) {
                        safe = false;
                    }
                }
            }
            chunks.push(cycleNodes);
        }
    }
    return { safe, chunks, cycles };
    function changeOutDegree(node, value) {
        const degree = outDegree.get(node) ?? 0;
        outDegree.set(node, degree + value);
    }
    function removeNode(node) {
        for (const from of reverseGraph.get(node)) {
            changeOutDegree(from, -1);
        }
        visited.add(node);
        nodes.delete(node);
    }
    function findCycle(startNode) {
        const queue = [[startNode, [startNode]]];
        const cycleVisited = new Set();
        const cycles = [];
        while (queue.length) {
            const [id, cycle] = queue.shift();
            const nodes = graph.get(id);
            if (!nodes)
                continue;
            for (const to of nodes) {
                if (to === startNode) {
                    cycleVisited.add(to);
                    cycles.push([...cycle]);
                    continue;
                }
                if (visited.has(to) || cycleVisited.has(to)) {
                    continue;
                }
                cycleVisited.add(to);
                queue.push([to, [...cycle, to]]);
            }
        }
        if (!cycles.length) {
            return [];
        }
        cycles.sort((a, b) => b.length - a.length);
        return cycles[0];
    }
}
