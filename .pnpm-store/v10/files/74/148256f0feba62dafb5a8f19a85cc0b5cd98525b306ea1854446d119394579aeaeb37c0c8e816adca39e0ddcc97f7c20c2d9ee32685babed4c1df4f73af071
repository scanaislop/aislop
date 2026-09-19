import { existsSync } from 'node:fs';
import { _glob } from '../../util/glob.js';
import { toEntry, toProductionDependency, toProductionEntry } from '../../util/input.js';
import { join, toAbsolute } from '../../util/path.js';
import { hasDependency, load } from '../../util/plugin.js';
import vite from '../vite/index.js';
const title = 'React Router';
const enablers = ['@react-router/dev'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const viteConfig = typeof vite.config === 'function' ? [] : (vite.config ?? []);
const config = ['react-router.config.{js,ts}', ...viteConfig];
const resolveConfig = async (localConfig, options) => {
    const { configFileDir } = options;
    const appDirectory = localConfig.appDirectory ?? 'app';
    const appDir = toAbsolute(appDirectory, configFileDir);
    globalThis.__reactRouterAppDirectory = appDir;
    let routeConfig = [];
    const routesPathTs = join(appDir, 'routes.ts');
    const routesPathJs = join(appDir, 'routes.js');
    if (existsSync(routesPathTs)) {
        routeConfig = await load(routesPathTs);
    }
    else if (existsSync(routesPathJs)) {
        routeConfig = await load(routesPathJs);
    }
    const mapRoute = (route) => {
        return [toAbsolute(route.file, appDir), ...(route.children ? route.children.flatMap(mapRoute) : [])];
    };
    const routes = routeConfig.flatMap(mapRoute);
    const resolved = [
        toEntry(join(appDir, 'routes.{js,ts}')),
        toProductionEntry(join(appDir, 'root.{jsx,tsx}')),
        toProductionEntry(join(appDir, 'entry.{client,server}.{js,jsx,ts,tsx}')),
        ...routes.map(id => toProductionEntry(id)),
    ];
    const serverEntries = await _glob({
        cwd: appDir,
        patterns: ['entry.server.{js,ts,jsx,tsx}'],
    });
    if (serverEntries.length === 0) {
        resolved.push(toProductionDependency('@react-router/node'));
        resolved.push(toProductionDependency('isbot'));
    }
    return resolved;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
