import { frontmatterMatcher, scriptBodies } from '../../compilers/compilers.js';
import { stylePreprocessorImports } from '../../compilers/style-preprocessors.js';
const propsDeclMatcher = /(?:^|[\s;])(?:interface|type)\s+Props\b/;
const compiler = (text, path) => {
    let out = '';
    const frontmatter = text.match(frontmatterMatcher);
    if (frontmatter?.[1]) {
        let fm = frontmatter[1];
        if (propsDeclMatcher.test(fm) && text.includes('Astro.props'))
            fm += '\ntype __knip_astro_props = Props;';
        out = fm;
    }
    const scriptContent = scriptBodies(text, path);
    if (scriptContent)
        out = out ? `${out}\n${scriptContent}` : scriptContent;
    const styleImports = stylePreprocessorImports(text, path);
    if (styleImports)
        out = out ? `${out}\n${styleImports}` : styleImports;
    return out;
};
export default compiler;
