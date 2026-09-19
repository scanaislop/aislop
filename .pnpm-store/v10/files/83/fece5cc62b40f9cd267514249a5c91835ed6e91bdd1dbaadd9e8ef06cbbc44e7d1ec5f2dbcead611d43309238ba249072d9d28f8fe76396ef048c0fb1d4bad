import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { DEFAULT_INPUT, DEFAULT_OUTPUT, parseScripts } from './helpers.js';
const title = '@sveltejs/package';
const enablers = ['@sveltejs/package'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const resolveSourceMap = ({ cwd, manifest }) => {
    const ios = parseScripts(manifest.scripts);
    const effective = ios.length > 0 ? ios : [{ input: DEFAULT_INPUT, output: DEFAULT_OUTPUT }];
    const seen = new Set();
    const pairs = [];
    for (const { input, output } of effective) {
        const key = `${input}→${output}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        pairs.push({ srcDir: join(cwd, input), outDir: join(cwd, output) });
    }
    return pairs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    resolveSourceMap,
};
export default plugin;
