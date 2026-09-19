import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { getInputs, isFlatConfig, resolveFormatters } from './helpers.js';
import { getInputsFromFlatConfigAST } from './resolveFromAST.js';
const title = 'ESLint';
const enablers = ['eslint', '@eslint/js'];
const isEnabled = ({ dependencies, manifest }) => hasDependency(dependencies, enablers) ||
    Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));
const packageJsonPath = 'eslintConfig';
const config = [
    'eslint.config.{js,cjs,mjs,ts,cts,mts}',
    '.eslintrc',
    '.eslintrc.{js,json,cjs}',
    '.eslintrc.{yml,yaml}',
    'package.json',
];
const isLoadConfig = ({ configFileName, manifest }, dependencies) => {
    if (isFlatConfig(configFileName))
        return false;
    if (manifest.getMajor('eslint') === 9 && dependencies.has('eslint-config-next'))
        return false;
    return true;
};
const resolveConfig = (localConfig, options) => getInputs(localConfig, options);
const resolveFromAST = (program, options) => {
    if (isFlatConfig(options.configFileName))
        return getInputsFromFlatConfigAST(program);
    return [];
};
const note = `### ESLint v9

The ESLint plugin config resolver is disabled when using \`eslint-config-next\` (\`next lint\`).

Root cause: [microsoft/rushstack#4965](https://github.com/microsoft/rushstack/issues/4965)/[#5049](https://github.com/microsoft/rushstack/issues/5049)

### ESLint v8

If relying on [configuration cascading](https://eslint.org/docs/v8.x/use/configure/configuration-files#cascading-and-hierarchy),
consider using an extended glob pattern like this:

\`\`\`json
{
  "eslint": ["**/.eslintrc.js"]
}
\`\`\`
`;
export const docs = { note };
const args = {
    config: true,
    alias: { format: ['f'] },
    boolean: ['inspect-config'],
    resolveInputs: (parsed) => {
        const inputs = [];
        if (parsed['inspect-config'])
            inputs.push(toDependency('@eslint/config-inspector', { optional: true }));
        if (parsed['format'])
            for (const input of resolveFormatters(parsed['format']))
                inputs.push(input);
        return inputs;
    },
};
const plugin = {
    title,
    enablers,
    isEnabled,
    packageJsonPath,
    config,
    args,
    isLoadConfig,
    resolveConfig,
    resolveFromAST,
};
export default plugin;
