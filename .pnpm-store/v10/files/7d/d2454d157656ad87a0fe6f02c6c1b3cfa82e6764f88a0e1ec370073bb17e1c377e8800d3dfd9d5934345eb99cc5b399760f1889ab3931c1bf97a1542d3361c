import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { entry as playwrightEntry, resolveConfig as playwrightResolveConfig } from '../playwright/index.js';
const title = 'Playwright for components';
const enablers = [/^@playwright\/experimental-ct-/];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['playwright-ct.config.{js,ts}'];
const ctEntry = 'playwright/index.{js,ts,jsx,tsx}';
const entry = [...playwrightEntry, ctEntry];
const resolveConfig = async (localConfig, options) => {
    const inputs = await playwrightResolveConfig(localConfig, options);
    inputs.push(toEntry(ctEntry));
    return inputs;
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
