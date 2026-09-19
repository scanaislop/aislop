import { isDirectory } from '../../util/fs.js';
import { toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import compiler from './compiler.js';
const title = 'Prisma';
const enablers = ['prisma', /^@prisma\/.*/];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['prisma/schema.prisma', 'schema.prisma'];
const config = [
    'prisma.config.{js,ts,mjs,cjs,mts,cts}',
    '.config/prisma.{js,ts,mjs,cjs,mts,cts}',
    'package.json',
];
const resolveSchema = (path, cwd) => {
    if (!isDirectory(cwd, path)) {
        return toEntry(path);
    }
    return toEntry(join(path, '**/*.prisma'));
};
const resolveConfig = async (config, options) => {
    const inputs = [];
    if (config.seed) {
        inputs.push(...options.getInputsFromScripts(config.seed));
    }
    else if (config.migrations?.seed) {
        inputs.push(...options.getInputsFromScripts(config.migrations.seed));
    }
    if (config.schema) {
        inputs.push(resolveSchema(config.schema, options.cwd));
    }
    return inputs;
};
const registerCompilers = ({ registerCompiler, hasDependency }) => {
    if (hasDependency('prisma'))
        registerCompiler({ extension: '.prisma', compiler });
};
const args = {
    config: true,
    resolveInputs: (parsed, { cwd }) => {
        const inputs = [];
        if (typeof parsed['schema'] === 'string') {
            inputs.push(resolveSchema(parsed['schema'], cwd));
        }
        return inputs;
    },
};
const plugin = {
    title,
    enablers,
    isEnabled,
    entry,
    config,
    args,
    resolveConfig,
    registerCompilers,
};
export default plugin;
