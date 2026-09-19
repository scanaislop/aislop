export const fencedCodeBlockMatcher = /```[\s\S]*?```/g;
export const inlineCodeMatcher = /`[^`]+`/g;
export const scriptExtractor = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script>/gi;
export const styleExtractor = /<style\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/style>/gi;
const langAttrMatcher = /\blang\s*=\s*["']([^"']+)["']/i;
export const blockCommentMatcher = /\/\*[\s\S]*?\*\//g;
export const lineCommentMatcher = /^[ \t]*\/\/.*$/gm;
export const importMatcher = /import(?:\s*\(\s*['"][^'"]+['"][^)]*\)|(?!\s*\()[^'"]+['"][^'"]+['"])/g;
export const collectImports = text => {
    if (!text.includes('import'))
        return '';
    const imports = [];
    importMatcher.lastIndex = 0;
    let match;
    while ((match = importMatcher.exec(text)))
        imports.push(match[0]);
    return imports.join('\n');
};
export const importsWithinScripts = (text) => {
    const scripts = [];
    scriptExtractor.lastIndex = 0;
    let scriptMatch;
    while ((scriptMatch = scriptExtractor.exec(text))) {
        const scriptBody = scriptMatch[2];
        const body = scriptBody.replace(blockCommentMatcher, '').replace(lineCommentMatcher, '');
        let importMatch;
        importMatcher.lastIndex = 0;
        while ((importMatch = importMatcher.exec(body)))
            scripts.push(importMatch[0]);
    }
    return scripts.join(';\n');
};
export const scriptBodies = (text) => {
    const scripts = [];
    scriptExtractor.lastIndex = 0;
    let match;
    while ((match = scriptExtractor.exec(text))) {
        const body = match[2];
        if (body)
            scripts.push(body);
    }
    return scripts.join(';\n');
};
export const getStyleLang = (attrs) => attrs.match(langAttrMatcher)?.[1]?.toLowerCase();
export const frontmatterMatcher = /^---\r?\n([\s\S]*?)\r?\n---/;
export const importsWithinFrontmatter = (text, keys = []) => {
    const frontmatter = text.match(frontmatterMatcher)?.[1];
    if (!frontmatter)
        return '';
    const imports = keys.flatMap(key => {
        const valueMatcher = new RegExp(`${key}:\\s*["']([^"']+)["']`, 'i');
        const match = frontmatter.match(valueMatcher);
        return match?.[1] ? [`import ${key} from "${match[1]}";`] : [];
    });
    return imports.join('\n');
};
