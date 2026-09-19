import { access, cp, rm, stat } from "node:fs/promises";
import path from "node:path";
//#region src/utils/fs.ts
function fsExists(path) {
	return access(path).then(() => true, () => false);
}
function fsStat(path) {
	return stat(path).catch(() => null);
}
function fsRemove(path) {
	return rm(path, {
		force: true,
		recursive: true
	}).catch(() => {});
}
function fsCopy(from, to) {
	return cp(from, to, {
		recursive: true,
		force: true
	});
}
function lowestCommonAncestor(...filepaths) {
	if (filepaths.length === 0) return "";
	if (filepaths.length === 1) return path.dirname(filepaths[0]);
	filepaths = filepaths.map(path.normalize);
	const [first, ...rest] = filepaths;
	let ancestor = first.split(path.sep);
	for (const filepath of rest) {
		const directories = filepath.split(path.sep, ancestor.length);
		let index = 0;
		for (const directory of directories) if (directory === ancestor[index]) index += 1;
		else {
			ancestor = ancestor.slice(0, index);
			break;
		}
		ancestor = ancestor.slice(0, index);
	}
	return ancestor.length <= 1 && ancestor[0] === "" ? path.sep + ancestor[0] : ancestor.join(path.sep);
}
function stripExtname(filePath) {
	const ext = path.extname(filePath);
	if (!ext.length) return filePath;
	return filePath.slice(0, -ext.length);
}
//#endregion
//#region src/utils/format.ts
function formatBytes(bytes) {
	if (bytes === Infinity) return void 0;
	if (bytes > 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
	return `${(bytes / 1e3).toFixed(2)} kB`;
}
//#endregion
export { fsStat as a, fsRemove as i, fsCopy as n, lowestCommonAncestor as o, fsExists as r, stripExtname as s, formatBytes as t };
