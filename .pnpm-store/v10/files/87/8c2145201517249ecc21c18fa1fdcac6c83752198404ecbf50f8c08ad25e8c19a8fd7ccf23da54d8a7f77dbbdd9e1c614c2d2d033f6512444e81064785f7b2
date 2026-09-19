import { collectPropertyValues } from '../../typescript/ast-helpers.js';
import { isDirectory } from '../../util/fs.js';
import { toConfig, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Next.js';
const enablers = ['next'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['next.config.{js,ts,cjs,mjs,mts}'];
const defaultPageExtensions = ['{js,jsx,ts,tsx}'];
const productionEntryFilePatterns = [
    'app/{,[(]*[)]/}{manifest,robots}.{js,ts}',
    'app/**/sitemap.{js,ts}',
    'app/**/{icon,apple-icon,opengraph-image,twitter-image}.{js,jsx,ts,tsx}',
];
const rootOrSrc = '{,src/}';
const getRouterDirPrefix = (cwd, name) => {
    if (!cwd)
        return rootOrSrc;
    if (isDirectory(cwd, name))
        return '';
    if (isDirectory(cwd, `src/${name}`))
        return 'src/';
    return rootOrSrc;
};
const getEntryFilePatterns = (pageExtensions = defaultPageExtensions, cwd) => {
    const ext = pageExtensions.length === 1 ? pageExtensions[0] : `{${pageExtensions.join(',')}}`;
    const appDirPrefix = getRouterDirPrefix(cwd, 'app');
    const pagesDirPrefix = getRouterDirPrefix(cwd, 'pages');
    return [
        ...productionEntryFilePatterns.map(pattern => `${appDirPrefix}${pattern}`),
        `${rootOrSrc}{instrumentation,instrumentation-client,middleware,proxy}.${ext}`,
        `${appDirPrefix}app/global-{error,not-found}.${ext}`,
        `${appDirPrefix}app/**/{default,error,forbidden,loading,not-found,unauthorized}.${ext}`,
        `${appDirPrefix}app/**/{layout,page,route,template}.${ext}`,
        `${pagesDirPrefix}pages/**/*.${ext}`,
    ];
};
const production = getEntryFilePatterns();
const resolveFromAST = (program, { configFileDir }) => {
    const pageExtensions = [...collectPropertyValues(program, 'pageExtensions')];
    const extensions = pageExtensions.length > 0 ? pageExtensions : defaultPageExtensions;
    const patterns = [...getEntryFilePatterns(extensions, configFileDir), 'next-env.d.ts'];
    return patterns.map(id => toProductionEntry(join(configFileDir, id)));
};
const commands = new Set(['dev', 'build', 'start']);
const args = {
    boolean: ['turbo', 'turbopack'],
    resolveInputs: parsed => {
        const dir = commands.has(parsed._[0]) ? parsed._[1] : undefined;
        if (!dir)
            return [];
        return [toConfig('next', join(dir, 'next.config'))];
    },
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveFromAST,
    args,
};
export default plugin;
