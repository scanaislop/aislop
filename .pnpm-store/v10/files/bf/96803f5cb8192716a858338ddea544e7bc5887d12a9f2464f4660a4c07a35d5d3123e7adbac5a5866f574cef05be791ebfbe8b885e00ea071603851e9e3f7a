import { Visitor } from 'oxc-parser';
import { findImportedCalls, findProperty, getFirstPropertyValue, getPropertyValues, } from '../../typescript/ast-helpers.js';
import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
export const defaultSrcDir = 'public';
export const defaultFilename = 'sw.js';
const isNuxtConfig = (configFileName) => configFileName.startsWith('nuxt.config.');
const getInjectManifestEntry = (options, configFileDir) => {
    if (!getPropertyValues(options, 'strategies').has('injectManifest'))
        return;
    const srcDir = getFirstPropertyValue(options, 'srcDir') ?? defaultSrcDir;
    const filename = getFirstPropertyValue(options, 'filename') ?? defaultFilename;
    return toProductionEntry(join(configFileDir, srcDir, filename));
};
export const resolveFromAST = (program, options) => {
    const inputs = [];
    if (isNuxtConfig(options.configFileName)) {
        const visitor = new Visitor({
            ObjectExpression(node) {
                const pwa = findProperty(node, 'pwa');
                if (pwa?.type !== 'ObjectExpression')
                    return;
                const entry = getInjectManifestEntry(pwa, options.configFileDir);
                if (entry)
                    inputs.push(entry);
            },
        });
        visitor.visit(program);
        return inputs;
    }
    for (const call of findImportedCalls(program, 'vite-plugin-pwa')) {
        const entry = getInjectManifestEntry(call.arguments?.[0], options.configFileDir);
        if (entry)
            inputs.push(entry);
    }
    return inputs;
};
