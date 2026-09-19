import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import compiler from './compiler.js';
const title = 'Tailwind';
const enablers = ['tailwindcss', '@tailwindcss/vite', '@tailwindcss/postcss', '@tailwindcss/cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['tailwind.config.{js,cjs,mjs,ts,cts,mts}'];
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    for (const enabler of enablers) {
        if (!hasDependency(enabler))
            continue;
        registerCompiler({ extension: '.css', compiler });
        break;
    }
};
const args = {
    binaries: ['tailwindcss'],
    string: ['input'],
    alias: { input: ['i'] },
    resolveInputs: parsed => (parsed.input ? [toProductionEntry(parsed.input)] : []),
};
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    args,
    registerCompilers,
};
export default plugin;
