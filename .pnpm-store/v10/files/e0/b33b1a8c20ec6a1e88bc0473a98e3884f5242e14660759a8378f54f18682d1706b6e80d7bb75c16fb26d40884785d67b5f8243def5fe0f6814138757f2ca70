import { collectPropertyValues } from '../../typescript/ast-helpers.js';
import { toEntry } from '../../util/input.js';
const PATH_KEY = 'path';
const TRANSFORMER_KEY = 'transformer';
export const resolveFromAST = program => {
    const values = [...collectPropertyValues(program, PATH_KEY), ...collectPropertyValues(program, TRANSFORMER_KEY)];
    return values.map(id => toEntry(id));
};
