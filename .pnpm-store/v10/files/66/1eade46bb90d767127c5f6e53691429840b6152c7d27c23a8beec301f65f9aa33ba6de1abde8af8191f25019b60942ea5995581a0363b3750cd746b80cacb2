function isOctal(code) {
    return code >= 48 && code <= 55;
}
function isHex(code) {
    return (code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102);
}
function codePoint(value, fallback) {
    try {
        return String.fromCodePoint(value);
    }
    catch {
        return fallback;
    }
}
export function decodeAnsiCQuoted(source, start, limit) {
    let pos = start;
    let value = "";
    while (pos < limit && source.charCodeAt(pos) !== 39) {
        if (source.charCodeAt(pos) !== 92 || pos + 1 >= limit) {
            const runStart = pos;
            while (pos < limit) {
                const code = source.charCodeAt(pos);
                // A backslash at the end of input has nothing to escape; consume it as a
                // literal so the loop always advances.
                if (code === 39 || (code === 92 && pos + 1 < limit))
                    break;
                pos++;
            }
            value += source.slice(runStart, pos);
            continue;
        }
        const escapeStart = pos++;
        const escaped = source[pos++];
        switch (escaped) {
            case "a":
                value += "\x07";
                break;
            case "b":
                value += "\b";
                break;
            case "e":
            case "E":
                value += "\x1B";
                break;
            case "f":
                value += "\f";
                break;
            case "n":
                value += "\n";
                break;
            case "r":
                value += "\r";
                break;
            case "t":
                value += "\t";
                break;
            case "v":
                value += "\v";
                break;
            case "\\":
                value += "\\";
                break;
            case "'":
                value += "'";
                break;
            case '"':
                value += '"';
                break;
            case "?":
                value += "?";
                break;
            case "\n":
                break;
            case "c": {
                // The closing quote (or end of input) is not an operand: \c stays literal.
                const code = pos < limit ? source.charCodeAt(pos) : 39;
                if (code === 39) {
                    value += source.slice(escapeStart, pos);
                    break;
                }
                pos++;
                if (code === 92) {
                    // Bash writes a backslash operand as the pair \c\\; a lone backslash
                    // still decodes and leaves the character it escaped as a literal.
                    const pair = pos < limit && source.charCodeAt(pos) === 92;
                    if (pair)
                        pos++;
                    value += "\x1c";
                    if (!pair && pos < limit) {
                        value += source[pos];
                        pos++;
                    }
                    break;
                }
                value += String.fromCharCode(code === 63 ? 127 : code & 31);
                break;
            }
            case "x":
            case "u":
            case "U": {
                const digitsStart = pos;
                const maxDigits = escaped === "x" ? 2 : escaped === "u" ? 4 : 8;
                while (pos < limit && pos - digitsStart < maxDigits && isHex(source.charCodeAt(pos)))
                    pos++;
                if (pos === digitsStart) {
                    value += `\\${escaped}`;
                    break;
                }
                const raw = source.slice(escapeStart, pos);
                value += codePoint(Number.parseInt(source.slice(digitsStart, pos), 16), raw);
                break;
            }
            default: {
                const escapedCode = escaped.charCodeAt(0);
                if (!isOctal(escapedCode)) {
                    value += `\\${escaped}`;
                    break;
                }
                while (pos < limit && pos - escapeStart - 1 < 3 && isOctal(source.charCodeAt(pos)))
                    pos++;
                value += String.fromCharCode(Number.parseInt(source.slice(escapeStart + 1, pos), 8) & 0xff);
                break;
            }
        }
    }
    const closed = pos < limit;
    if (closed)
        pos++;
    return { value, end: pos, closed };
}
