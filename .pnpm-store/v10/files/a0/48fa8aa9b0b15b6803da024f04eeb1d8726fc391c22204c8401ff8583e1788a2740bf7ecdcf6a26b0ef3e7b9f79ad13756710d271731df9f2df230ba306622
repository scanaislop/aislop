import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { substringBefore } from '../../util/string.js';
const title = 'Astro Markdoc';
const enablers = ['@astrojs/markdoc'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['markdoc.config.{js,ts,mjs,mts}'];
const extractSpecifiers = (renderField) => {
    if (typeof renderField === 'string') {
        return [substringBefore(renderField, '#')];
    }
    if (renderField && typeof renderField === 'object') {
        for (const key of ['Component', 'file', 'path']) {
            if (typeof renderField[key] === 'string') {
                return [substringBefore(renderField[key], '#')];
            }
        }
    }
    return [];
};
const resolveConfig = async (localConfig) => {
    if (!localConfig)
        return [];
    const entries = [...Object.values(localConfig.nodes ?? {}), ...Object.values(localConfig.tags ?? {})];
    const specifiers = entries.flatMap(item => item && typeof item === 'object' && 'render' in item ? extractSpecifiers(item.render) : []);
    return specifiers.map(id => toProductionEntry(id));
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
export default plugin;
