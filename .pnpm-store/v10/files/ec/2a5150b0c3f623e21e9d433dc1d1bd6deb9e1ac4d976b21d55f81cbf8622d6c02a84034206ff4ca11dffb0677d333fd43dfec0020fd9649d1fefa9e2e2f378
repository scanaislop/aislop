import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import { join } from './path.js';
const empty = join(fileURLToPath(import.meta.url), '../empty.js');
const options = {
    alias: {
        '@rushstack/eslint-config/patch/modern-module-resolution': empty,
        '@rushstack/eslint-patch/modern-module-resolution': empty,
    },
    tsconfigPaths: true,
};
const createLoader = (options) => createJiti(process.cwd(), options);
export const jiti = createLoader(options);
