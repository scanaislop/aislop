import { toDependency, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'React Email';
const enablers = ['react-email'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['emails/**/*.tsx'];
const previewCommands = new Set(['build', 'dev', 'start']);
const args = {
    binaries: ['email'],
    alias: { dir: ['d'] },
    resolveInputs: (parsed, { manifest }) => {
        const inputs = [];
        if (previewCommands.has(parsed._[0])) {
            const dep = (manifest.getMajor('react-email') ?? 6) >= 6 ? '@react-email/ui' : '@react-email/preview-server';
            inputs.push(toDependency(dep));
        }
        if (parsed.dir)
            inputs.push(toEntry(`${parsed.dir}/**/*.tsx`));
        return inputs;
    },
};
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    args,
};
export default plugin;
