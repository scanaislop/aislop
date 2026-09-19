import { flattenIssues, getIssueTypeTitle, getTableForType } from './util/util.js';
export default ({ report, issues, cwd }) => {
    const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
    for (const [reportType, isReportType] of Object.entries(report)) {
        if (isReportType) {
            const title = reportMultipleGroups ? getIssueTypeTitle(reportType) : undefined;
            const issuesForType = flattenIssues(issues[reportType]);
            if (issuesForType.length > 0) {
                console.log(`<details>\n${title ? `<summary>${title} (${issuesForType.length})</summary>\n` : ''}\n\`\`\``);
                console.log(getTableForType(issuesForType, cwd, { isUseColors: false }).toString());
                console.log('```\n\n</details>\n');
            }
        }
    }
};
