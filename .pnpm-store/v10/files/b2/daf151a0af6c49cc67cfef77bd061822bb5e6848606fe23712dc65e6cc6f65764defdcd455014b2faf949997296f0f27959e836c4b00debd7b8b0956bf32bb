export const EMPTY_TAGS = new Set();
export function buildJSDocTagLookup(comments, sourceText) {
    const entries = [];
    for (const comment of comments) {
        if (comment.type !== 'Block')
            continue;
        const value = comment.value;
        let index = value.indexOf('@');
        if (index === -1)
            continue;
        let tags;
        while (index !== -1) {
            let end = index + 1;
            while (end < value.length &&
                (((value.charCodeAt(end) | 32) >= 97 && (value.charCodeAt(end) | 32) <= 122) ||
                    (value.charCodeAt(end) >= 48 && value.charCodeAt(end) <= 57) ||
                    value.charCodeAt(end) === 95))
                end++;
            if (end > index + 1) {
                if (!tags)
                    tags = new Set();
                tags.add(value.slice(index, end));
            }
            index = value.indexOf('@', end);
        }
        if (!tags)
            continue;
        let reach = comment.end;
        for (;;) {
            while (reach < sourceText.length) {
                const ch = sourceText.charCodeAt(reach);
                if (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
                    reach++;
                    continue;
                }
                break;
            }
            if (reach + 1 < sourceText.length &&
                sourceText.charCodeAt(reach) === 47 &&
                sourceText.charCodeAt(reach + 1) === 47) {
                const eol = sourceText.indexOf('\n', reach + 2);
                reach = eol === -1 ? sourceText.length : eol + 1;
                continue;
            }
            break;
        }
        entries.push({ reach, tags });
    }
    if (entries.length === 0)
        return () => EMPTY_TAGS;
    return function getJSDocTags(nodeStart) {
        let lo = 0;
        let hi = entries.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const r = entries[mid].reach;
            if (r === nodeStart)
                return entries[mid].tags;
            if (r < nodeStart)
                lo = mid + 1;
            else
                hi = mid - 1;
        }
        return EMPTY_TAGS;
    };
}
