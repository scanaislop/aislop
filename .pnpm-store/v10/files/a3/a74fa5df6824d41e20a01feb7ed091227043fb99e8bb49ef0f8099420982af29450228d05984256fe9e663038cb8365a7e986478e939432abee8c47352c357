import { globSync } from 'tinyglobby';
import { compact } from './array.js';
import { computeGlobCacheKey, createDirTracker, getCachedGlob, isGlobCacheEnabled, setCachedGlob, } from './glob-cache.js';
import { getGitignoreFingerprint, glob, reconcileGitignoredPaths } from './glob-core.js';
import { timerify } from './Performance.js';
import { isAbsolute, join, relative } from './path.js';
const prepend = (pattern, relativePath) => isAbsolute(pattern.replace(/^!/, '')) ? pattern : prependDirToPattern(relativePath, pattern);
const prependDirToPatterns = (cwd, dir, patterns) => compact([patterns].flat().map(p => removeProductionSuffix(prepend(p, relative(cwd, dir))))).sort(negatedLast);
export const removeProductionSuffix = (pattern) => pattern.replace(/!$/, '');
const negatedLast = (pattern) => (pattern.startsWith('!') ? 1 : -1);
export const prependDirToPattern = (dir, pattern) => {
    if (pattern.startsWith('!'))
        return `!${join(dir, pattern.slice(1))}`;
    return join(dir, pattern);
};
export const negate = (pattern) => pattern.replace(/^!?/, '!');
export const hasProductionSuffix = (pattern) => pattern.endsWith('!');
export const hasNoProductionSuffix = (pattern) => !pattern.endsWith('!');
const defaultGlob = async ({ cwd, dir = cwd, patterns, gitignore = true, label }) => {
    if (patterns.length === 0)
        return [];
    const globPatterns = prependDirToPatterns(cwd, dir, patterns);
    if (globPatterns[0].startsWith('!'))
        return [];
    const cacheEnabled = isGlobCacheEnabled();
    const gitignoreFingerprint = gitignore ? getGitignoreFingerprint() : '';
    const cacheKey = cacheEnabled
        ? computeGlobCacheKey({ patterns: globPatterns, cwd, dir, gitignore, gitignoreFingerprint })
        : '';
    if (cacheEnabled) {
        const cached = getCachedGlob(cacheKey);
        if (cached)
            return gitignore ? reconcileGitignoredPaths(cached, cwd) : cached;
    }
    const tracker = cacheEnabled ? createDirTracker() : undefined;
    const paths = await glob(globPatterns, {
        cwd,
        dir,
        gitignore,
        absolute: true,
        dot: true,
        label,
        fs: tracker?.fs,
    });
    if (cacheEnabled && paths.length > 0)
        setCachedGlob(cacheKey, paths, dir, tracker?.dirs);
    return gitignore ? reconcileGitignoredPaths(paths, cwd) : paths;
};
const syncGlob = ({ cwd, patterns }) => {
    const cacheEnabled = isGlobCacheEnabled();
    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    const cacheKey = cacheEnabled
        ? computeGlobCacheKey({ patterns: patternList, cwd, dir: cwd, gitignore: false, gitignoreFingerprint: '' })
        : '';
    if (cacheEnabled) {
        const cached = getCachedGlob(cacheKey);
        if (cached)
            return cached;
    }
    const tracker = cacheEnabled ? createDirTracker() : undefined;
    const paths = globSync(patterns, {
        cwd,
        absolute: true,
        followSymbolicLinks: false,
        expandDirectories: false,
        fs: tracker?.fs,
    });
    if (cacheEnabled && paths.length > 0)
        setCachedGlob(cacheKey, paths, cwd, tracker?.dirs);
    return paths;
};
const dirGlob = async ({ cwd, patterns, gitignore = true }) => glob(patterns, {
    cwd,
    dir: cwd,
    onlyDirectories: true,
    gitignore,
});
export const _glob = timerify(defaultGlob);
export const _syncGlob = timerify(syncGlob);
export const _dirGlob = timerify(dirGlob);
