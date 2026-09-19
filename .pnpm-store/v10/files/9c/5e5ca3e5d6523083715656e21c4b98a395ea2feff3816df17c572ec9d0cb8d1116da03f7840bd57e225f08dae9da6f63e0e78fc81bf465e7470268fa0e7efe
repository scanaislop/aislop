import { ISSUE_TYPE_TITLE } from '../constants.js';
import { toPosix, toRelative } from '../util/path.js';
import { version } from '../version.js';
import { flattenIssues, getIssueDescription } from './util/util.js';
const schema = 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json';
const getLevel = (severity) => severity === 'error' ? 'error' : severity === 'warn' ? 'warning' : 'note';
const getProblemSeverity = (severity) => severity === 'error' ? 'error' : severity === 'warn' ? 'warning' : 'recommendation';
const getRuleId = (type) => `knip/${type}`;
const getUri = (filePath, cwd) => toPosix(toRelative(filePath, cwd))
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
const getLocation = ({ filePath, line, col, symbol }, cwd) => ({
    physicalLocation: {
        artifactLocation: { uri: getUri(filePath, cwd) },
        ...(line !== undefined && {
            region: {
                startLine: Math.max(line, 1),
                ...(col !== undefined && {
                    startColumn: Math.max(col, 1),
                    endColumn: Math.max(col, 1) + Math.max(symbol.length, 1),
                }),
            },
        }),
    },
});
const sortByLocation = (a, b) => a.filePath.localeCompare(b.filePath) ||
    (a.line ?? 0) - (b.line ?? 0) ||
    (a.col ?? 0) - (b.col ?? 0) ||
    a.symbol.localeCompare(b.symbol);
export default ({ report, issues, cwd }) => {
    const groups = [];
    for (const [type, isReportType] of Object.entries(report)) {
        if (!isReportType)
            continue;
        const issuesForType = flattenIssues(issues[type]).sort(sortByLocation);
        if (issuesForType.length > 0)
            groups.push({ type, issues: issuesForType });
    }
    const rules = groups.map(({ type, issues }) => {
        const severity = issues[0].severity;
        const title = ISSUE_TYPE_TITLE[type];
        return {
            id: getRuleId(type),
            name: type,
            shortDescription: { text: title },
            helpUri: 'https://knip.dev/reference/issue-types',
            defaultConfiguration: { level: getLevel(severity) },
            properties: { 'problem.severity': getProblemSeverity(severity) },
        };
    });
    const results = groups.flatMap(({ type, issues }, ruleIndex) => issues.map(issue => ({
        ruleId: getRuleId(type),
        ruleIndex,
        level: getLevel(issue.severity),
        message: { text: getIssueDescription(issue) },
        locations: [getLocation(issue, cwd)],
    })));
    const output = JSON.stringify({
        $schema: schema,
        version: '2.1.0',
        runs: [
            {
                tool: {
                    driver: {
                        name: 'knip',
                        version,
                        semanticVersion: version,
                        informationUri: 'https://knip.dev',
                        rules,
                    },
                },
                results,
            },
        ],
    });
    process.stdout._handle?.setBlocking?.(true);
    process.stdout.write(`${output}\n`);
};
