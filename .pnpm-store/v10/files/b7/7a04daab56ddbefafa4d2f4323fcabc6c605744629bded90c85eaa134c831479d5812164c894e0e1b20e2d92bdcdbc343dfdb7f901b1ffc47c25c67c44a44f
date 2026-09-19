import st from '../util/colors.js';
import { perfObserver } from '../util/Performance.js';
import { prettyMilliseconds } from '../util/string.js';
import { flattenIssues, getIssueTypeTitle, getTableForType } from './util/util.js';
export default (options, { issues, streamer, duration, size }) => {
    const reportMultipleGroups = Object.values(options.includedIssueTypes).filter(Boolean).length > 1;
    let totalIssues = 0;
    const lines = [];
    for (const [reportType, isReportType] of Object.entries(options.includedIssueTypes)) {
        if (isReportType) {
            const title = reportMultipleGroups && getIssueTypeTitle(reportType);
            const issuesForType = flattenIssues(issues[reportType]);
            if (issuesForType.length > 0) {
                if (title) {
                    lines.push(`${st.style(['yellowBright', 'underline'], title)} (${issuesForType.length})`);
                }
                lines.push(...getTableForType(issuesForType, options.cwd).toRows());
            }
            totalIssues = totalIssues + issuesForType.length;
        }
    }
    const mem = perfObserver.getCurrentMemUsageInMb();
    const ms = duration ?? perfObserver.getCurrentDurationInMs();
    const summary = `${size} files (${prettyMilliseconds(ms)} • ${mem}MB)`;
    const messages = totalIssues === 0
        ? ['✂️  Excellent, Knip found no issues.', '', st.gray(summary)]
        : [...lines, '', st.gray(summary)];
    if (options.isDebug)
        console.log(messages.join('\n'));
    else
        streamer.cast(messages);
};
