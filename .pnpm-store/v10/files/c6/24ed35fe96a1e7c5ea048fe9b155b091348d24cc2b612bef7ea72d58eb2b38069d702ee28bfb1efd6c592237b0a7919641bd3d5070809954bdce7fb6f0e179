import { readFileSync } from 'node:fs';
import { FOREIGN_FILE_EXTENSIONS } from '../constants.js';
import { debugLog } from '../util/debug.js';
import { extname, isInternal } from '../util/path.js';
export class SourceFileManager {
    sourceTextCache = new Map();
    syncCompilers;
    asyncCompilers;
    constructor({ compilers }) {
        this.syncCompilers = compilers[0];
        this.asyncCompilers = compilers[1];
    }
    readFile(filePath) {
        const cachedSourceText = this.sourceTextCache.get(filePath);
        if (cachedSourceText !== undefined)
            return cachedSourceText;
        const ext = extname(filePath);
        const compiler = this.syncCompilers.get(ext);
        if (FOREIGN_FILE_EXTENSIONS.has(ext) && !compiler) {
            this.sourceTextCache.set(filePath, '');
            return '';
        }
        const contents = this.readRawFile(filePath);
        if (contents === undefined) {
            if (isInternal(filePath))
                debugLog('*', `Unable to read ${filePath}`);
            this.sourceTextCache.set(filePath, '');
            return '';
        }
        const compiled = compiler ? compiler(contents, filePath) : contents;
        if (compiler)
            debugLog('*', `Compiled ${filePath}`);
        this.sourceTextCache.set(filePath, compiled);
        return compiled;
    }
    invalidate(filePath) {
        this.sourceTextCache.delete(filePath);
    }
    async compileAndAddSourceFile(filePath) {
        const contents = this.readRawFile(filePath);
        if (contents === undefined)
            throw new Error(`Unable to read ${filePath}`);
        const ext = extname(filePath);
        const compiler = this.asyncCompilers.get(ext);
        if (compiler) {
            const compiled = await compiler(contents, filePath);
            debugLog('*', `Compiled ${filePath}`);
            this.sourceTextCache.set(filePath, compiled);
        }
    }
    readRawFile(filePath) {
        try {
            return readFileSync(filePath, 'utf8');
        }
        catch {
            return undefined;
        }
    }
}
