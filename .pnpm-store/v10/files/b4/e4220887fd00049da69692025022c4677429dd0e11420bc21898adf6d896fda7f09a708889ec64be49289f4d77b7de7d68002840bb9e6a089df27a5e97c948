import { execSync } from 'node:child_process';
import { join } from './path.js';
const hookFileNames = [
    'prepare-commit-msg',
    'commit-msg',
    'pre-{applypatch,commit,merge-commit,push,rebase,receive}',
    'post-{checkout,commit,merge,rewrite}',
];
const getGitHooksPath = (defaultPath = '.git/hooks', cwd) => {
    try {
        return execSync('git rev-parse --git-path hooks', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
            cwd,
        }).trim();
    }
    catch (_error) {
        return defaultPath;
    }
};
export const getGitHookPaths = (defaultPath = '.git/hooks', followGitConfig = true, cwd) => {
    const gitHooksPath = followGitConfig ? getGitHooksPath(defaultPath, cwd) : defaultPath;
    return hookFileNames.map(fileName => join(gitHooksPath, fileName));
};
