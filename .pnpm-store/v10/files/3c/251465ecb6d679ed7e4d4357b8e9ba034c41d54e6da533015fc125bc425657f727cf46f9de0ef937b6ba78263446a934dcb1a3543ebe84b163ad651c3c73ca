import { readdirSync } from 'node:fs';
import { isFile, loadJSON } from '../../util/fs.js';
import { basename, dirname, join } from '../../util/path.js';
const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const getDependencies = async (cwd) => {
    const manifest = await loadJSON(join(cwd, 'package.json'));
    const dependencies = new Set();
    if (!isRecord(manifest))
        return dependencies;
    for (const field of dependencyFields) {
        const values = manifest[field];
        if (isRecord(values))
            for (const packageName in values)
                dependencies.add(packageName);
    }
    return dependencies;
};
const findConfig = (cwd, packageName) => {
    let dir = cwd;
    while (true) {
        const filePath = join(dir, 'node_modules', packageName, 'marko.json');
        if (isFile(filePath))
            return filePath;
        const parent = dirname(dir);
        if (parent === dir)
            return;
        dir = parent;
    }
};
const readDir = (dir) => {
    try {
        return readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return [];
    }
};
const getTagName = (fileName) => (fileName.endsWith('.marko') ? basename(fileName, '.marko') : undefined);
const isTagDir = (dir, name) => isFile(dir, 'index.marko') || isFile(dir, `${name}.marko`);
const getTags = (dir) => {
    const tags = new Set();
    for (const entry of readDir(dir)) {
        if (entry.name.startsWith('.'))
            continue;
        if (entry.isFile()) {
            const name = getTagName(entry.name);
            if (name)
                tags.add(name);
            continue;
        }
        if (!entry.isDirectory())
            continue;
        const tagDir = join(dir, entry.name);
        if (isTagDir(tagDir, entry.name)) {
            tags.add(entry.name);
            continue;
        }
        if (entry.name === 'tags' || entry.name === 'components')
            continue;
        for (const child of readDir(tagDir)) {
            if (child.isFile()) {
                const name = getTagName(child.name);
                if (name)
                    tags.add(name);
            }
            else if (child.isDirectory() && isTagDir(join(tagDir, child.name), child.name)) {
                tags.add(child.name);
            }
        }
    }
    return tags;
};
export const getTaglibDependencies = async (cwd) => {
    const tagDependencies = new Map();
    const fallbackDependencies = [];
    for (const packageName of await getDependencies(cwd)) {
        const configPath = findConfig(cwd, packageName);
        if (!configPath)
            continue;
        let config;
        try {
            config = await loadJSON(configPath);
        }
        catch {
            fallbackDependencies.push(packageName);
            continue;
        }
        if (!isRecord(config)) {
            fallbackDependencies.push(packageName);
            continue;
        }
        const tagsDir = typeof config.exports === 'string'
            ? config.exports
            : typeof config['tags-dir'] === 'string'
                ? config['tags-dir']
                : undefined;
        if (!tagsDir) {
            fallbackDependencies.push(packageName);
            continue;
        }
        for (const tagName of getTags(join(dirname(configPath), tagsDir))) {
            const dependencies = tagDependencies.get(tagName);
            if (dependencies)
                dependencies.push(packageName);
            else
                tagDependencies.set(tagName, [packageName]);
        }
    }
    return { tagDependencies, fallbackDependencies };
};
