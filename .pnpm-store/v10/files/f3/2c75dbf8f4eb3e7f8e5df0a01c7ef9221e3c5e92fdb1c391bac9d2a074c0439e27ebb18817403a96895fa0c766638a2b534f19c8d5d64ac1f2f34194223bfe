import { basename, dirname } from './path.js';
const getPkgName = (parent, base) => (parent.charAt(0) === '@' ? `${parent}/${base}` : base);
const getName = (dir) => (dir ? getPkgName(basename(dirname(dir)), basename(dir)) : undefined);
export function getPackageName(pkg, pathname) {
    const { name } = pkg;
    return name || getName(pathname);
}
