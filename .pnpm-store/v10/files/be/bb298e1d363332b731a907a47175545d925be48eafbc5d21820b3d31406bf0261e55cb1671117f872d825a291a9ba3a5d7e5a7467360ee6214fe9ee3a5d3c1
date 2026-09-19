import { readFile } from 'node:fs/promises';
import { glob } from 'tinyglobby';
import { partition } from './array.js';
import { debugLog } from './debug.js';
import { ConfigurationError } from './errors.js';
import { logWarning } from './log.js';
import { getPackageName } from './package-name.js';
import { join } from './path.js';
export default async function mapWorkspaces(cwd, workspaces) {
    const [negatedPatterns, patterns] = partition(workspaces, p => p.match(/^!/));
    const packages = new Map();
    const wsPkgNames = new Set();
    if (patterns.length === 0 && negatedPatterns.length === 0)
        return [packages, wsPkgNames];
    const manifestPatterns = patterns.map(p => join(p, 'package.json'));
    const matches = await glob(manifestPatterns, {
        cwd,
        ignore: ['**/node_modules/**', ...negatedPatterns.map(p => join(p.slice(1), 'package.json'))],
    });
    for (const match of matches.sort()) {
        const name = match === 'package.json' ? '.' : match.replace(/\/package\.json$/, '');
        const dir = join(cwd, name);
        const manifestPath = join(cwd, match);
        try {
            const manifestStr = (await readFile(manifestPath, 'utf8')).replace(/^﻿/, '');
            const manifest = JSON.parse(manifestStr);
            const pkgName = getPackageName(manifest, dir);
            const pkg = { dir, name, pkgName, manifestPath, manifestStr, manifest };
            packages.set(name, pkg);
            if (pkgName)
                wsPkgNames.add(pkgName);
            else
                throw new ConfigurationError(`Missing package name in ${manifestPath}`);
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                debugLog('*', `Unable to load package.json for ${name}`);
            }
            else if (error instanceof SyntaxError) {
                logWarning(`Skipping workspace ${name}: invalid JSON in ${manifestPath} (${error.message})`);
            }
            else
                throw error;
        }
    }
    return [packages, wsPkgNames];
}
