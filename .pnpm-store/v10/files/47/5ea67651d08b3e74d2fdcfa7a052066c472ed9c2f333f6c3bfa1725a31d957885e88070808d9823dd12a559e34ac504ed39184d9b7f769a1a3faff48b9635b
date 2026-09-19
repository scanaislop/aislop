import { createHash } from 'node:crypto';
import { toRelative } from '../util/path.js';
import { flattenIssues, getIssueDescription, getIssuePrefix, getIssueTypeTitle } from './util/util.js';
export default async ({ report, issues, cwd }) => {
    const entries = [];
    for (const [type, isReportType] of Object.entries(report)) {
        if (!isReportType) {
            continue;
        }
        for (const issue of flattenIssues(issues[type])) {
            const { filePath } = issue;
            if (type === 'duplicates' && issue.symbols) {
                entries.push(...issue.symbols.map(symbol => ({
                    type: 'issue',
                    check_name: getIssueTypeTitle(type),
                    description: getSymbolDescription({ type: issue.type, symbol, parentSymbol: issue.parentSymbol }),
                    categories: ['Duplication'],
                    location: createLocation(filePath, cwd, symbol.line, symbol.col),
                    severity: convertSeverity(issue.severity),
                    fingerprint: createFingerprint(filePath, cwd, symbol.symbol),
                })));
            }
            else {
                entries.push({
                    type: 'issue',
                    check_name: getIssueTypeTitle(type),
                    description: getIssueDescription(issue),
                    categories: ['Bug Risk'],
                    location: createLocation(filePath, cwd, issue.line, issue.col),
                    severity: convertSeverity(issue.severity),
                    fingerprint: createFingerprint(filePath, cwd, issue.symbol),
                });
            }
        }
    }
    const output = JSON.stringify(entries);
    process.stdout._handle?.setBlocking?.(true);
    process.stdout.write(`${output}\n`);
};
function convertSeverity(severity) {
    switch (severity) {
        case 'error':
            return 'major';
        case 'warn':
            return 'minor';
        default:
            return 'info';
    }
}
function getSymbolDescription({ type, symbol, parentSymbol, }) {
    return `${getIssuePrefix(type)}: ${symbol.symbol}${parentSymbol ? ` (${parentSymbol})` : ''}`;
}
function createLocation(filePath, cwd, line, col) {
    if (col !== undefined) {
        return {
            path: toRelative(filePath, cwd),
            positions: {
                begin: {
                    line: line ?? 0,
                    column: col,
                },
                end: {
                    line: line ?? 0,
                    column: col,
                },
            },
        };
    }
    return {
        path: toRelative(filePath, cwd),
        lines: {
            begin: line ?? 0,
            end: line ?? 0,
        },
    };
}
function createFingerprint(filePath, cwd, message) {
    const md5 = createHash('md5');
    md5.update(toRelative(filePath, cwd));
    md5.update(message);
    return md5.digest('hex');
}
