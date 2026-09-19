import { ISSUE_TYPES } from '../constants.js';
export const initIssues = () => Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, {}]));
export const initCounters = () => ({
    ...Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, 0])),
    processed: 0,
    total: 0,
});
export const defaultRules = Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, issueType === 'cycles' ? 'warn' : 'error']));
