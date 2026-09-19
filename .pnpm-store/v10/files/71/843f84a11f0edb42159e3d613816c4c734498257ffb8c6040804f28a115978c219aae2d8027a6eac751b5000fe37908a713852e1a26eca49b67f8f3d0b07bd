import { ALIAS_TAG, BETA_TAG, INTERNAL_TAG, PUBLIC_TAG } from '../constants.js';
export const splitTags = (rawTags) => {
    const tags = rawTags.flatMap(tag => tag.split(','));
    return tags.reduce(([incl, excl], tag) => {
        const match = tag.match(/[a-zA-Z]+/);
        if (match)
            (tag.startsWith('-') ? excl : incl).push(`@${match[0]}`);
        return [incl, excl];
    }, [[], []]);
};
const hasTag = (tags, jsDocTags) => tags.some(tag => jsDocTags.has(tag));
export const shouldIgnore = (jsDocTags, tags) => {
    const [includeJSDocTags, excludeJSDocTags] = tags;
    if (includeJSDocTags.length > 0 && !hasTag(includeJSDocTags, jsDocTags))
        return true;
    if (excludeJSDocTags.length > 0 && hasTag(excludeJSDocTags, jsDocTags))
        return true;
    return false;
};
export const isAlwaysIgnored = (jsDocTags) => jsDocTags.has(PUBLIC_TAG) || jsDocTags.has(BETA_TAG) || jsDocTags.has(ALIAS_TAG);
export const getShouldIgnoreHandler = (isProduction) => (jsDocTags) => isAlwaysIgnored(jsDocTags) || (isProduction && jsDocTags.has(INTERNAL_TAG));
export const getShouldIgnoreTagHandler = (tags) => (jsDocTags) => shouldIgnore(jsDocTags, tags);
