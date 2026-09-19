import { collectFirstPropertyValue, findCallArg, findProperty, getFirstPropertyValue, hasImportSpecifier, } from '../../typescript/ast-helpers.js';
import { _parseFile } from '../../typescript/ast-nodes.js';
import { _syncGlob } from '../../util/glob.js';
import { toAlias, toIgnore, toProductionEntry } from '../../util/input.js';
import { config as viteConfig } from '../vite/index.js';
const production = [
    'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
    'src/hooks.{server,client}.{js,ts}',
    'src/params/*.{js,ts}',
    'src/service-worker.{js,ts}',
    'src/service-worker/index.{js,ts}',
    'src/instrumentation.server.{js,ts}',
];
const isConfigInViteConfig = (dir, readFile) => {
    for (const filePath of _syncGlob({ cwd: dir, patterns: viteConfig })) {
        const text = readFile(filePath);
        if (text && findCallArg(_parseFile(filePath, text).program, 'sveltekit'))
            return true;
    }
    return false;
};
const getLibFromViteConfig = (program) => {
    const call = findCallArg(program, 'sveltekit');
    const files = call ? findProperty(call, 'files') : undefined;
    return (files && getFirstPropertyValue(files, 'lib')) ?? 'src/lib';
};
const getLibFromSvelteConfig = (program) => collectFirstPropertyValue(program, 'lib') ?? 'src/lib';
const toInputs = (lib) => [
    ...production.map(pattern => toProductionEntry(pattern)),
    toAlias('$lib', [`./${lib}`]),
    toAlias('$lib/*', [`./${lib}/*`]),
    toIgnore('\\$app/.+', 'unresolved'),
    toIgnore('\\$env/.+', 'unresolved'),
    toIgnore('\\$service-worker', 'unresolved'),
];
export const resolveFromAST = (program, options) => {
    if (options.configFileName.startsWith('vite.config')) {
        if (!hasImportSpecifier(program, '@sveltejs/kit/vite', 'sveltekit'))
            return [];
        return toInputs(getLibFromViteConfig(program));
    }
    if (isConfigInViteConfig(options.configFileDir, options.readFile))
        return [];
    return toInputs(getLibFromSvelteConfig(program));
};
