import { stripVTControlCharacters } from 'node:util';
const CONTROL_CHARACTERS = /\u001b\[[0-9;]+m/g;
export const ELLIPSIS = '…';
export const substringBefore = (value, separator) => {
    const index = value.indexOf(separator);
    return index === -1 ? value : value.slice(0, index);
};
const collator = new Intl.Collator();
export const compareStrings = (a, b) => collator.compare(a, b);
const getTruncatedParts = (input, limit, fromStart) => {
    const parts = [];
    let width = 0;
    let index = 0;
    let truncated = false;
    while (index < input.length) {
        CONTROL_CHARACTERS.lastIndex = index;
        const match = CONTROL_CHARACTERS.exec(input);
        if (match && match.index === index) {
            index = CONTROL_CHARACTERS.lastIndex;
            parts.push(match[0]);
            continue;
        }
        if (fromStart && width >= limit)
            truncated = true;
        else
            parts.push(input[index]);
        width++;
        index++;
    }
    if (fromStart)
        return { parts, truncated };
    let indexRight = 0;
    const toKeep = (value) => value.length > 1 || indexRight++ < limit;
    const _parts = parts.reverse().filter(toKeep);
    return { parts: _parts.reverse(), truncated: indexRight > limit };
};
export const truncate = (text, width) => {
    if (stripVTControlCharacters(text).length <= width)
        return text;
    const { parts, truncated } = getTruncatedParts(text, width - ELLIPSIS.length, true);
    if (!truncated)
        return text;
    if (parts.at(-1)?.length === 1)
        return parts.join('') + ELLIPSIS;
    return [...parts.slice(0, -1), ELLIPSIS, parts.at(-1)].join('');
};
export const truncateStart = (text, width) => {
    if (stripVTControlCharacters(text).length <= width)
        return text;
    const { parts, truncated } = getTruncatedParts(text, width - ELLIPSIS.length, false);
    if (!truncated)
        return text;
    if (parts[0].length === 1)
        return ELLIPSIS + parts.join('');
    return [parts[0], ELLIPSIS, ...parts.slice(1)].join('');
};
export const pad = (text, width, fillString, align) => {
    const escapedWidth = width + (text.length - stripVTControlCharacters(text).length);
    return align === 'right'
        ? text.padStart(escapedWidth, fillString)
        : align === 'center'
            ? text.padStart((text.length + escapedWidth) / 2, fillString).padEnd(escapedWidth, fillString)
            : text.padEnd(escapedWidth, fillString);
};
export const prettyMilliseconds = (ms) => {
    const seconds = ms / 1000;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0)
        return `${hours}h ${minutes % 60}m ${Math.floor(seconds % 60)}s`;
    if (minutes > 0)
        return `${minutes}m ${Math.floor(seconds % 60)}s`;
    if (seconds > 10)
        return `${Math.round(seconds)}s`;
    if (seconds > 1)
        return `${seconds.toFixed(1)}s`;
    return `${Math.round(ms)}ms`;
};
