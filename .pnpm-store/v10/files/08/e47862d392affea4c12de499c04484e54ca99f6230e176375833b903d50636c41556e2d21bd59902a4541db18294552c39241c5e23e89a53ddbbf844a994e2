import path from 'node:path';
const isWin = process.platform === 'win32';
export const isAbsolute = path.isAbsolute;
export const dirname = path.posix.dirname;
export const extname = path.posix.extname;
export const basename = path.posix.basename;
export const join = path.posix.join;
export const toPosix = isWin ? (value) => value.split(path.sep).join(path.posix.sep) : (value) => value;
export const resolve = path.posix.resolve;
export const relative = (from, to) => {
    if (to.startsWith(from)) {
        const next = to[from.length];
        if (next === '/')
            return to.substring(from.length + 1);
        if (next === undefined)
            return '.';
    }
    const result = path.relative(from, to);
    return isWin ? toPosix(result) : result || '.';
};
export const isInNodeModules = (filePath) => filePath.includes('node_modules');
export const toAbsolute = (id, base) => (isAbsolute(id) ? id : join(base, id));
export const toRelative = (id, base) => (isAbsolute(id) ? relative(base, id) : id);
export const isInternal = (id) => (id.startsWith('.') || isAbsolute(id)) && !isInNodeModules(id);
export const normalize = path.posix.normalize;
