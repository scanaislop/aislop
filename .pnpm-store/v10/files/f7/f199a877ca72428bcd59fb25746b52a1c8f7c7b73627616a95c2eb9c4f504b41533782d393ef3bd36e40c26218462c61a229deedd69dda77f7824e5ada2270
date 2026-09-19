import { fencedCodeBlockMatcher, importMatcher, importsWithinFrontmatter, inlineCodeMatcher, } from '../../compilers/compilers.js';
const frontmatterImportFields = ['layout'];
const compiler = (text) => {
    const frontmatterImports = importsWithinFrontmatter(text, frontmatterImportFields);
    if (!text.includes('import'))
        return frontmatterImports;
    const imports = [];
    const source = text.replace(fencedCodeBlockMatcher, '').replace(inlineCodeMatcher, '');
    let match;
    importMatcher.lastIndex = 0;
    while ((match = importMatcher.exec(source)))
        imports.push(match[0]);
    if (frontmatterImports)
        imports.push(frontmatterImports);
    return imports.join('\n');
};
export default compiler;
