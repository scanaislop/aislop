import { toDeferResolve, toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'React Cosmos';
const enablers = ['react-cosmos'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['cosmos.config.json'];
const ext = '{js,jsx,ts,tsx,md,mdx}';
const fixtureEntry = [`**/*.fixture.${ext}`, `__fixtures__/**/*.${ext}`, `**/fixture.${ext}`];
const decoratorEntry = ['**/cosmos.decorator.{jsx,tsx}'];
const entry = [...fixtureEntry, ...decoratorEntry];
const resolveConfig = async (localConfig) => {
    const { fixturesDir, fixtureFileSuffix } = localConfig;
    const entries = [
        join(fixturesDir ?? '__fixtures__', `**/*.${ext}`),
        join(fixturesDir ?? '', `**/*.${fixtureFileSuffix ?? 'fixture'}.${ext}`),
        join(fixturesDir ?? '', `**/${fixtureFileSuffix ?? 'fixture'}.${ext}`),
    ];
    return [...entries, ...decoratorEntry]
        .map(id => toEntry(id))
        .concat((localConfig?.plugins ?? []).map(id => toDeferResolve(id)));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveConfig,
};
export default plugin;
