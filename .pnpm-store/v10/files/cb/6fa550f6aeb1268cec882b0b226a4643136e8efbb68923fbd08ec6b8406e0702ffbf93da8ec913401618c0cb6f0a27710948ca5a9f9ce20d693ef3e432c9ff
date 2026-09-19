import { ISSUE_TYPE_TITLE } from '../constants.js';
import { relative } from '../util/path.js';
import { compareStrings } from '../util/string.js';
import { hintPrinters } from './util/configuration-hints.js';
import { flattenIssues, getIssueTypeTitle } from './util/util.js';
const createGitHubActionsLogger = () => {
    const formatAnnotation = (level, message, options) => {
        const params = [`file=${options.file}`];
        if (options.startLine != null)
            params.push(`line=${options.startLine}`);
        if (options.endLine != null)
            params.push(`endLine=${options.endLine}`);
        if (options.startColumn != null)
            params.push(`col=${options.startColumn}`);
        if (options.endColumn != null)
            params.push(`endColumn=${options.endColumn}`);
        params.push(`title=✂️ Knip${options.title ? ` / ${options.title}` : ''}`);
        const paramString = params.join(',');
        console.log(`::${level} ${paramString}::${message}`);
    };
    return {
        info: (message) => console.log(message),
        error: (message, options) => formatAnnotation('error', message, options),
        warning: (message, options) => formatAnnotation('warning', message, options),
        notice: (message, options) => formatAnnotation('notice', message, options),
    };
};
export default ({ report, issues, cwd, configurationHints, tagHints, isDisableConfigHints, isDisableTagHints, isTreatConfigHintsAsErrors, isTreatTagHintsAsErrors, configFilePath, }) => {
    const core = createGitHubActionsLogger();
    const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
    for (const [reportType, isReportType] of Object.entries(report)) {
        if (isReportType) {
            const title = reportMultipleGroups && getIssueTypeTitle(reportType);
            const issuesForType = flattenIssues(issues[reportType]);
            issuesForType.sort((a, b) => compareStrings(a.filePath, b.filePath) || (a.line ?? 0) - (b.line ?? 0));
            if (issuesForType.length > 0) {
                title && core.info(`${title} (${issuesForType.length})`);
                for (const issue of issuesForType) {
                    if (issue.isFixed || issue.severity === 'off')
                        continue;
                    const log = issue.severity === 'error' ? core.error : core.warning;
                    const filePath = relative(cwd, issue.filePath);
                    const message = reportType === 'files' ? issue.symbol : `${issue.symbol} in ${filePath}`;
                    log(message, {
                        file: filePath,
                        startLine: issue.line ?? 1,
                        endLine: issue.line ?? 1,
                        startColumn: issue.col ?? 1,
                        endColumn: issue.col ?? 1,
                        title: ISSUE_TYPE_TITLE[issue.type],
                    });
                }
            }
        }
    }
    if (!isDisableConfigHints && configurationHints.length > 0) {
        const CONFIG_HINTS_TITLE = 'Configuration hints';
        core.info(`${CONFIG_HINTS_TITLE} (${configurationHints.length})`);
        const sortedHints = configurationHints.toSorted((a, b) => compareStrings(a.filePath ?? '', b.filePath ?? ''));
        for (const hint of sortedHints) {
            const hintPrinter = hintPrinters.get(hint.type);
            const message = hintPrinter?.print({
                ...hint,
                filePath: hint.filePath ?? configFilePath ?? '',
                configFilePath,
            }) ?? '';
            const file = hint.filePath
                ? relative(cwd, hint.filePath)
                : configFilePath
                    ? relative(cwd, configFilePath)
                    : 'knip.json';
            const hintMessage = `${message}: ${hint.identifier} in ${file}`;
            if (isTreatConfigHintsAsErrors) {
                core.error(hintMessage, {
                    file,
                    startLine: 1,
                    endLine: 1,
                    startColumn: 1,
                    endColumn: 1,
                    title: CONFIG_HINTS_TITLE,
                });
            }
            else {
                core.notice(hintMessage, {
                    file,
                    startLine: 1,
                    endLine: 1,
                    startColumn: 1,
                    endColumn: 1,
                    title: CONFIG_HINTS_TITLE,
                });
            }
        }
    }
    if (!isDisableTagHints && tagHints.size > 0) {
        const TAG_HINTS_TITLE = 'Tag hints';
        core.info(`${TAG_HINTS_TITLE} (${tagHints.size})`);
        const sortedHints = Array.from(tagHints);
        sortedHints.sort((a, b) => compareStrings(a.filePath, b.filePath));
        for (const hint of sortedHints) {
            const file = relative(cwd, hint.filePath);
            const hintMessage = `Unused tag in ${file}: ${hint.identifier} → ${hint.tagName}`;
            const log = isTreatTagHintsAsErrors ? core.error : core.notice;
            log(hintMessage, {
                file,
                startLine: 1,
                endLine: 1,
                startColumn: 1,
                endColumn: 1,
                title: TAG_HINTS_TITLE,
            });
        }
    }
};
