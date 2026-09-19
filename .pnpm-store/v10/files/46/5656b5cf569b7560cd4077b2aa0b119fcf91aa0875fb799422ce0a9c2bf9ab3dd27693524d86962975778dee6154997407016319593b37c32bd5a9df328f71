import { fencedCodeBlockMatcher, frontmatterMatcher, inlineCodeMatcher } from './compilers.js';
const dependencies = [
    '@mdx-js/esbuild',
    '@mdx-js/loader',
    '@mdx-js/mdx',
    '@mdx-js/node-loader',
    '@mdx-js/preact',
    '@mdx-js/react',
    '@mdx-js/rollup',
    '@mdx-js/vue',
    'remark-mdx',
];
const mdxImportMatcher = /^import[^'"]+['"][^'"]+['"]/gm;
const compiler = (text) => {
    if (!text.includes('import'))
        return '';
    const imports = [];
    const source = text
        .replace(frontmatterMatcher, '')
        .replace(fencedCodeBlockMatcher, '')
        .replace(inlineCodeMatcher, '');
    let match;
    mdxImportMatcher.lastIndex = 0;
    while ((match = mdxImportMatcher.exec(source)))
        imports.push(match[0]);
    return imports.join('\n');
};
export default { dependencies, compiler };
