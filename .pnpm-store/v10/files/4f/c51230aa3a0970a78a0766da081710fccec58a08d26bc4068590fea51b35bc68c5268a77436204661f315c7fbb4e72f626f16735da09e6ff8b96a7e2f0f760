"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relative = exports.resolve = void 0;
const util_1 = require("./util");
const CHAR_DOT = 46; /* . */
const CHAR_FORWARD_SLASH = 47; /* / */
const CHAR_BACKWARD_SLASH = 92; /* \ */
const CHAR_COLON = 58; /* : */
const CHAR_UPPERCASE_A = 65; /* A */
const CHAR_UPPERCASE_Z = 90; /* Z */
const CHAR_LOWERCASE_A = 97; /* a */
const CHAR_LOWERCASE_Z = 122; /* z */
function isPathSeparatorWin(code) {
    return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
}
function isWindowsDeviceRoot(code) {
    return (code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z) ||
        (code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z);
}
const _isWin32 = typeof process !== 'undefined' && process.platform === 'win32';
/**
 * Windows variant of `resolve()`. Mirrors Node's `path.win32.resolve`
 * semantics enough for the WASI shim's needs (drive-letter absolutes
 * + UNC paths + per-drive cwd lookups via `process.env`/`process.cwd`).
 *
 * Why this is needed: on Windows, `FileDescriptor.realPath` is the
 * host realpath returned by `fs.realpathSync(realPath, 'utf8')` — the
 * backslash form `D:\…`. The POSIX-only `resolveImpl` below only
 * treats `/` as a separator, reads `D` as non-`/`, decides realPath
 * is "relative", and produces a garbage joined path. Downstream
 * `fs.openSync(garbage)` then returns `EINVAL` and the WASI caller
 * sees a permanent failure. This function gives us the correct
 * Windows-style resolution without taking a Node-only `path` import
 * (which would break browser bundles of this package).
 *
 * Cribbed from Node's `lib/path.js` `win32.resolve()` (MIT-licensed),
 * trimmed to what WASI realpath resolution actually exercises.
 */
function resolveWin32(args) {
    let resolvedDevice = '';
    let resolvedTail = '';
    let resolvedAbsolute = false;
    for (let i = args.length - 1; i >= -1; i--) {
        let path;
        if (i >= 0) {
            path = args[i];
            (0, util_1.validateString)(path, 'path');
            if (path.length === 0)
                continue;
        }
        else if (resolvedDevice.length === 0) {
            path = (typeof process !== 'undefined' && typeof process.cwd === 'function')
                ? process.cwd()
                : '';
        }
        else {
            // Look up per-drive cwd via the `=X:` env var convention; fall back
            // to the global cwd if absent.
            const envKey = `=${resolvedDevice}`;
            const env = (typeof process !== 'undefined') ? process.env : undefined;
            path = (env && typeof env[envKey] === 'string')
                ? env[envKey]
                : (typeof process !== 'undefined' && typeof process.cwd === 'function')
                    ? process.cwd()
                    : '';
            if (path === undefined ||
                (path.slice(0, 2).toLowerCase() !== resolvedDevice.toLowerCase() &&
                    path.charCodeAt(2) === CHAR_BACKWARD_SLASH)) {
                path = `${resolvedDevice}\\`;
            }
        }
        const len = path.length;
        let rootEnd = 0;
        let device = '';
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len === 1) {
            if (isPathSeparatorWin(code)) {
                rootEnd = 1;
                isAbsolute = true;
            }
        }
        else if (isPathSeparatorWin(code)) {
            isAbsolute = true;
            if (isPathSeparatorWin(path.charCodeAt(1))) {
                // UNC path: `\\server\share\…`
                let j = 2;
                let last = j;
                while (j < len && !isPathSeparatorWin(path.charCodeAt(j)))
                    j++;
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    while (j < len && isPathSeparatorWin(path.charCodeAt(j)))
                        j++;
                    if (j < len && j !== last) {
                        last = j;
                        while (j < len && !isPathSeparatorWin(path.charCodeAt(j)))
                            j++;
                        if (j === len || j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            }
            else {
                rootEnd = 1;
            }
        }
        else if (isWindowsDeviceRoot(code) && path.charCodeAt(1) === CHAR_COLON) {
            device = path.slice(0, 2);
            rootEnd = 2;
            if (len > 2 && isPathSeparatorWin(path.charCodeAt(2))) {
                isAbsolute = true;
                rootEnd = 3;
            }
        }
        if (device.length > 0) {
            if (resolvedDevice.length > 0) {
                if (device.toLowerCase() !== resolvedDevice.toLowerCase())
                    continue;
            }
            else {
                resolvedDevice = device;
            }
        }
        if (resolvedAbsolute) {
            if (resolvedDevice.length > 0)
                break;
        }
        else {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
            if (isAbsolute && resolvedDevice.length > 0)
                break;
        }
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, '\\', isPathSeparatorWin);
    return resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail || '.';
}
function isPosixPathSeparator(code) {
    return code === CHAR_FORWARD_SLASH;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = '';
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code = 0;
    for (let i = 0; i <= path.length; ++i) {
        if (i < path.length) {
            code = path.charCodeAt(i);
        }
        else if (isPathSeparator(code)) {
            break;
        }
        else {
            code = CHAR_FORWARD_SLASH;
        }
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {
                // NOOP
            }
            else if (dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 ||
                    res.charCodeAt(res.length - 1) !== CHAR_DOT ||
                    res.charCodeAt(res.length - 2) !== CHAR_DOT) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.indexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = '';
                            lastSegmentLength = 0;
                        }
                        else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength =
                                res.length - 1 - res.indexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                    else if (res.length !== 0) {
                        res = '';
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    res += res.length > 0 ? `${separator}..` : '..';
                    lastSegmentLength = 2;
                }
            }
            else {
                if (res.length > 0) {
                    res += `${separator}${path.slice(lastSlash + 1, i)}`;
                }
                else {
                    res = path.slice(lastSlash + 1, i);
                }
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        }
        else if (code === CHAR_DOT && dots !== -1) {
            ++dots;
        }
        else {
            dots = -1;
        }
    }
    return res;
}
function resolve(...args) {
    // On Windows, host paths are `D:\…` style. The POSIX-only resolver
    // below treats `D` as a non-`/` character and produces garbage; route
    // to the Windows-aware variant. POSIX hosts (Linux/macOS/browser)
    // run the original code path unchanged — `_isWin32` is constant-folded
    // away on those targets.
    if (_isWin32)
        return resolveWin32(args);
    let resolvedPath = '';
    let resolvedAbsolute = false;
    for (let i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        const path = i >= 0 ? args[i] : '/';
        (0, util_1.validateString)(path, 'path');
        // Skip empty entries
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    // Normalize the path
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, '/', isPosixPathSeparator);
    if (resolvedAbsolute) {
        return `/${resolvedPath}`;
    }
    return resolvedPath.length > 0 ? resolvedPath : '.';
}
exports.resolve = resolve;
function relative(from, to) {
    (0, util_1.validateString)(from, 'from');
    (0, util_1.validateString)(to, 'to');
    if (from === to)
        return '';
    // Trim leading forward slashes.
    from = resolve(from);
    to = resolve(to);
    if (from === to)
        return '';
    const fromStart = 1;
    const fromEnd = from.length;
    const fromLen = fromEnd - fromStart;
    const toStart = 1;
    const toLen = to.length - toStart;
    // Compare paths to find the longest common path from root
    const length = (fromLen < toLen ? fromLen : toLen);
    let lastCommonSep = -1;
    let i = 0;
    for (; i < length; i++) {
        const fromCode = from.charCodeAt(fromStart + i);
        if (fromCode !== to.charCodeAt(toStart + i)) {
            break;
        }
        else if (fromCode === CHAR_FORWARD_SLASH) {
            lastCommonSep = i;
        }
    }
    if (i === length) {
        if (toLen > length) {
            if (to.charCodeAt(toStart + i) === CHAR_FORWARD_SLASH) {
                // We get here if `from` is the exact base path for `to`.
                // For example: from='/foo/bar'; to='/foo/bar/baz'
                return to.slice(toStart + i + 1);
            }
            if (i === 0) {
                // We get here if `from` is the root
                // For example: from='/'; to='/foo'
                return to.slice(toStart + i);
            }
        }
        else if (fromLen > length) {
            if (from.charCodeAt(fromStart + i) === CHAR_FORWARD_SLASH) {
                // We get here if `to` is the exact base path for `from`.
                // For example: from='/foo/bar/baz'; to='/foo/bar'
                lastCommonSep = i;
            }
            else if (i === 0) {
                // We get here if `to` is the root.
                // For example: from='/foo/bar'; to='/'
                lastCommonSep = 0;
            }
        }
    }
    let out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`.
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
        if (i === fromEnd ||
            from.charCodeAt(i) === CHAR_FORWARD_SLASH) {
            out += out.length === 0 ? '..' : '/..';
        }
    }
    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts.
    return `${out}${to.slice(toStart + lastCommonSep)}`;
}
exports.relative = relative;
//# sourceMappingURL=path.js.map