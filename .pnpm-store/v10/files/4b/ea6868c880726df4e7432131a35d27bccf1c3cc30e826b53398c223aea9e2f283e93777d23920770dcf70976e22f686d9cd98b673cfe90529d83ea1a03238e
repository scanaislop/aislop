import picomatch from 'picomatch';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import { partition } from './util/array.js';
import { prependDirToPattern } from './util/glob.js';
import { initCounters, initIssues } from './util/issue-initializers.js';
import { relative } from './util/path.js';
const createMatcher = (patterns) => {
    const [negated, positive] = partition(patterns, p => p[0] === '!');
    if (positive.length === 0) {
        if (negated.length === 0)
            return () => false;
        return picomatch(negated, { dot: true });
    }
    return picomatch(positive, { dot: true, ignore: negated.map(p => p.slice(1)) });
};
export class IssueCollector {
    cwd;
    rules;
    workspaceFilter;
    issues = initIssues();
    counters = initCounters();
    referencedFiles = new Set();
    configurationHints = new Map();
    tagHints = new Set();
    ignorePatterns = new Set();
    ignoreFilesPatterns = new Set();
    isMatch;
    isFileMatch;
    issueMatchers = new Map();
    isTrackUnusedIgnorePatterns;
    unusedIgnorePatterns = new Map();
    unusedIgnoreFilesPatterns = new Map();
    selectedWorkspaces;
    constructor(options) {
        this.cwd = options.cwd;
        this.rules = options.rules;
        this.workspaceFilter = () => true;
        this.isMatch = () => false;
        this.isFileMatch = () => false;
        this.isTrackUnusedIgnorePatterns = !options.isDisableConfigHints;
    }
    setWorkspaceFilter(workspaceFilePathFilter) {
        if (workspaceFilePathFilter)
            this.workspaceFilter = workspaceFilePathFilter;
    }
    setSelectedWorkspaces(selectedWorkspaces) {
        this.selectedWorkspaces = selectedWorkspaces;
    }
    collectIgnorePatterns(entries, patterns, unused, type) {
        for (const entry of entries) {
            patterns.add(entry.pattern);
            if (!this.isTrackUnusedIgnorePatterns)
                continue;
            if (entry.pattern.startsWith('!'))
                continue;
            if (unused.has(entry.pattern))
                continue;
            unused.set(entry.pattern, {
                hint: { type, identifier: entry.id, workspaceName: entry.workspaceName },
                isMatch: picomatch(entry.pattern, { dot: true }),
            });
        }
        return createMatcher(patterns);
    }
    addIgnorePatterns(entries) {
        this.isMatch = this.collectIgnorePatterns(entries, this.ignorePatterns, this.unusedIgnorePatterns, 'ignore');
    }
    addIgnoreFilesPatterns(entries) {
        this.isFileMatch = this.collectIgnorePatterns(entries, this.ignoreFilesPatterns, this.unusedIgnoreFilesPatterns, 'ignoreFiles');
    }
    markUsedPatterns(filePath, unused) {
        if (unused.size === 0)
            return;
        for (const [pattern, { isMatch }] of unused) {
            if (isMatch(filePath))
                unused.delete(pattern);
        }
    }
    setIgnoreIssues(ignoreIssues) {
        if (!ignoreIssues)
            return;
        const issueTypePatterns = new Map();
        for (const [pattern, issueTypes] of Object.entries(ignoreIssues)) {
            const id = prependDirToPattern(this.cwd, pattern);
            for (const issueType of issueTypes) {
                if (!issueTypePatterns.has(issueType)) {
                    issueTypePatterns.set(issueType, []);
                }
                issueTypePatterns.get(issueType)?.push(id);
            }
        }
        for (const [issueType, patterns] of issueTypePatterns) {
            this.issueMatchers.set(issueType, picomatch(patterns, { dot: true }));
        }
    }
    shouldIgnoreIssue(filePath, issueType) {
        const matcher = this.issueMatchers.get(issueType);
        if (!matcher)
            return false;
        return matcher(filePath);
    }
    addFileCounts({ processed, unused }) {
        this.counters.processed += processed;
        this.counters.total += processed + unused;
    }
    addFilesIssues(filePaths) {
        for (const filePath of filePaths) {
            if (!this.workspaceFilter(filePath))
                continue;
            if (this.referencedFiles.has(filePath))
                continue;
            if (this.isMatch(filePath)) {
                this.markUsedPatterns(filePath, this.unusedIgnorePatterns);
                continue;
            }
            if (this.isFileMatch(filePath)) {
                this.markUsedPatterns(filePath, this.unusedIgnoreFilesPatterns);
                continue;
            }
            if (this.shouldIgnoreIssue(filePath, 'files'))
                continue;
            const symbol = relative(this.cwd, filePath);
            this.issues.files[symbol] = {
                [symbol]: { type: 'files', filePath, symbol, workspace: '', severity: this.rules.files, fixes: [] },
            };
            this.counters.files++;
            this.counters.processed++;
        }
    }
    addIssue(issue) {
        if (!this.workspaceFilter(issue.filePath))
            return;
        if (this.isMatch(issue.filePath)) {
            this.markUsedPatterns(issue.filePath, this.unusedIgnorePatterns);
            return;
        }
        if (this.shouldIgnoreIssue(issue.filePath, issue.type))
            return;
        if (this.rules[issue.type] === 'off')
            return;
        const key = relative(this.cwd, issue.filePath);
        issue.severity = this.rules[issue.type];
        const issues = this.issues[issue.type];
        issues[key] = issues[key] ?? {};
        const symbol = issue.parentSymbol ? `${issue.parentSymbol}.${issue.symbol}` : issue.symbol;
        if (!issues[key][symbol]) {
            issues[key][symbol] = issue;
            this.counters[issue.type]++;
        }
        return true;
    }
    addConfigurationHint(issue) {
        if (this.selectedWorkspaces) {
            const workspaceName = issue.workspaceName ?? ROOT_WORKSPACE_NAME;
            if (workspaceName === ROOT_WORKSPACE_NAME || !this.selectedWorkspaces.has(workspaceName))
                return;
        }
        const key = `${issue.workspaceName}::${issue.type}::${issue.identifier}`;
        if (!this.configurationHints.has(key))
            this.configurationHints.set(key, issue);
    }
    addTagHint(issue) {
        this.tagHints.add(issue);
    }
    purge() {
        const unusedFiles = new Set();
        for (const issues of Object.values(this.issues.files)) {
            for (const issue of Object.values(issues))
                unusedFiles.add(issue.filePath);
        }
        this.issues = initIssues();
        this.counters = initCounters();
        return unusedFiles;
    }
    getIssues() {
        return {
            issues: this.issues,
            counters: this.counters,
            tagHints: this.tagHints,
            configurationHints: Array.from(this.configurationHints.values()),
        };
    }
    getUnusedIgnorePatternHints(options) {
        if (!options.isReportFiles)
            return [];
        const hints = [];
        for (const p of this.unusedIgnorePatterns.values())
            hints.push(p.hint);
        for (const p of this.unusedIgnoreFilesPatterns.values())
            hints.push(p.hint);
        return hints;
    }
    retainedIssues = [];
    retainIssue(issue) {
        this.retainedIssues.push(issue);
    }
    getRetainedIssues() {
        return this.retainedIssues;
    }
}
