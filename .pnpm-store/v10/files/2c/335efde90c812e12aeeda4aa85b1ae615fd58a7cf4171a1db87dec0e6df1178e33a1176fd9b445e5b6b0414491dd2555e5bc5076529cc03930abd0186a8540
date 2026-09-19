import { findImportedCallArg, getPropertyValues } from '../../typescript/ast-helpers.js';
import { toProductionEntry } from '../../util/input.js';
export const resolveFromAST = program => {
    const starlightConfig = findImportedCallArg(program, '@astrojs/starlight');
    if (!starlightConfig)
        return [];
    const inputs = [];
    for (const id of getPropertyValues(starlightConfig, 'components'))
        inputs.push(toProductionEntry(id));
    for (const id of getPropertyValues(starlightConfig, 'customCss'))
        inputs.push(toProductionEntry(id));
    return inputs;
};
