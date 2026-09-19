import { importsWithinScripts } from '../../compilers/compilers.js';
import { stylePreprocessorImports } from '../../compilers/style-preprocessors.js';
import { dynamicImportsWithinTemplate } from '../../compilers/svelte.js';
const compiler = (text, path) => {
    const parts = [
        importsWithinScripts(text, path),
        dynamicImportsWithinTemplate(text, path),
        stylePreprocessorImports(text, path),
    ];
    return parts.filter(Boolean).join(';\n');
};
export default compiler;
