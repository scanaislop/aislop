export const compact = (collection) => Array.from(new Set(collection)).filter((value) => Boolean(value));
export const arrayify = (value) => Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
export const partition = (collection, predicate) => {
    const results = [[], []];
    for (const item of collection)
        results[predicate(item) ? 0 : 1].push(item);
    return results;
};
