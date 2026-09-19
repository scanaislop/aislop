import { toDependency, toIgnore, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Nitro';
const enablers = ['nitropack', 'nitro'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['nitro.config.{js,cjs,mjs,ts,cts,mts}'];
const production = [
    'server.{js,mjs,ts}',
    'api/**/*.ts',
    'routes/**/*.ts',
    'middleware/**/*.ts',
    'plugins/**/*.ts',
    '.nitro/types/*.d.ts',
];
const setup = async () => {
    if (globalThis && !('defineNitroConfig' in globalThis)) {
        Object.defineProperty(globalThis, 'defineNitroConfig', {
            value: (id) => id,
            writable: true,
            configurable: true,
        });
    }
};
const resolve = () => [toIgnore('^#nitro-internal-', 'unresolved')];
const resolveConfig = async (localConfig) => {
    const srcDir = localConfig.srcDir ?? '.';
    const patterns = [
        toProductionEntry('.nitro/types/*.d.ts'),
        ...[
            typeof localConfig.serverEntry === 'string' ? localConfig.serverEntry : 'server.{js,mjs,ts}',
            join(typeof localConfig.apiDir === 'string' ? localConfig.apiDir : 'api', '**/*.ts'),
            join(typeof localConfig.routesDir === 'string' ? localConfig.routesDir : 'routes', '**/*.ts'),
            'middleware/**/*.ts',
            'plugins/**/*.ts',
        ].map(pattern => toProductionEntry(join(srcDir, pattern))),
    ];
    const deps = localConfig.modules?.reduce((acc, id) => {
        if (Array.isArray(id) && typeof id[0] === 'string')
            acc.push(toDependency(id[0]));
        if (typeof id === 'string')
            acc.push(toDependency(id));
        return acc;
    }, []) ?? [];
    return [...deps, ...patterns];
};
const note = `Knip works best with [manual imports](https://nitro.build/guide/utils#manual-imports).
Nitro allows you to disable auto-imports by setting \`imports: false\` in your Nitro config.`;
export const docs = { note };
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    setup,
    resolve,
    resolveConfig,
};
export default plugin;
