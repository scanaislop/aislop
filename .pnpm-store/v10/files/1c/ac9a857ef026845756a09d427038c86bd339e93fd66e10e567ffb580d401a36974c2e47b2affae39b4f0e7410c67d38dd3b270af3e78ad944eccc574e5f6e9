import { printConfigurationHints, printTagHints } from './util/configuration-hints.js';
import { dim, flattenIssues, getColoredTitle, getIssueTypeTitle, getTableForType } from './util/util.js';
export default (options) => {
    const { report, issues, isDisableConfigHints, isDisableTagHints, isShowProgress } = options;
    let totalIssues = 0;
    for (const [reportType, isReportType] of Object.entries(report)) {
        if (isReportType) {
            const title = getIssueTypeTitle(reportType);
            const issuesForType = flattenIssues(issues[reportType]);
            if (issuesForType.length > 0) {
                title && console.log(getColoredTitle(title, issuesForType.length));
                const issues = typeof options.maxShowIssues === 'number'
                    ? Array.from(issuesForType).slice(0, options.maxShowIssues)
                    : issuesForType;
                if (issues.length > 0)
                    console.log(getTableForType(issues, options.cwd).toString());
                if (issues.length !== issuesForType.length)
                    console.log(dim(`…${issuesForType.length - issues.length} more items`));
                totalIssues = totalIssues + issuesForType.length;
            }
        }
    }
    if (!isDisableConfigHints) {
        printConfigurationHints(options);
    }
    if (!isDisableTagHints) {
        printTagHints(options);
    }
    if (totalIssues === 0 &&
        isShowProgress &&
        (!options.isTreatConfigHintsAsErrors || options.configurationHints.length === 0) &&
        (!options.isTreatTagHintsAsErrors || options.tagHints.size === 0)) {
        console.log('✂️  Excellent, Knip found no issues.');
    }
};
