import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parse as parseYAMLContents } from 'yaml';
import { parse as parseTOML } from 'smol-toml';
import stripJsonComments from 'strip-json-comments';
import { LoaderError } from './errors.js';
import { extname, join, toPosix } from './path.js';
export const isDirectory = (cwdOrPath, name) => {
    try {
        return statSync(name ? join(cwdOrPath, name) : cwdOrPath, { throwIfNoEntry: false })?.isDirectory() ?? false;
    }
    catch {
        return false;
    }
};
export const isFile = (cwdOrPath, name) => {
    try {
        return statSync(name ? join(cwdOrPath, name) : cwdOrPath, { throwIfNoEntry: false })?.isFile() ?? false;
    }
    catch {
        return false;
    }
};
export const findFile = (cwd, fileName) => {
    const filePath = join(cwd, fileName);
    return isFile(filePath) ? filePath : undefined;
};
export const findFileWithExtensions = (basePath, extensions) => {
    for (const ext of extensions) {
        const candidate = basePath + ext;
        if (existsSync(candidate))
            return candidate;
    }
};
export const loadFile = async (filePath) => {
    try {
        const contents = await readFile(filePath);
        return contents.toString();
    }
    catch (error) {
        throw new LoaderError(`Error loading ${filePath}`, { cause: error });
    }
};
export const hasFileWithExtension = (cwd, dirName, extensions) => {
    if (!isDirectory(cwd, dirName))
        return false;
    try {
        for (const file of readdirSync(join(cwd, dirName))) {
            if (extensions.includes(extname(file)))
                return true;
        }
    }
    catch { }
    return false;
};
export const loadJSON = async (filePath) => {
    const contents = (await loadFile(filePath)).replace(/^﻿/, '');
    try {
        return JSON.parse(contents);
    }
    catch {
        return parseJSONC(filePath, contents);
    }
};
export const loadJSONC = async (filePath) => {
    const contents = await loadFile(filePath);
    return parseJSONC(filePath, contents);
};
export const loadYAML = async (filePath) => {
    const contents = await loadFile(filePath);
    return parseYAML(contents);
};
export const loadTOML = async (filePath) => {
    const contents = await loadFile(filePath);
    return parseTOML(contents);
};
export const parseJSONC = async (filePath, contents) => {
    try {
        return JSON.parse(stripJsonComments(contents, { trailingCommas: true, whitespace: false }));
    }
    catch (error) {
        const message = `Error parsing ${filePath} ${extname(filePath) === '.json5' ? 'JSON5 features beyond comments and trailing commas are not fully supported. Consider converting to .jsonc format.' : ''}`;
        throw new LoaderError(message, { cause: error });
    }
};
export const parseYAML = (contents) => {
    return parseYAMLContents(contents, { logLevel: 'error' });
};
export const tryRealpath = (filePath) => {
    try {
        return toPosix(realpathSync.native(filePath));
    }
    catch {
        return filePath;
    }
};
