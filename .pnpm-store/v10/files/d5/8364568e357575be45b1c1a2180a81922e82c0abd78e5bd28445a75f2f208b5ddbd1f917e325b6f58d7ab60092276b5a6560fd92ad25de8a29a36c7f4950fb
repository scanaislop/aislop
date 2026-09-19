import { fix } from './IssueFixer.js';
import { run } from './run.js';
import parseArgs, { helpText } from './util/cli-arguments.js';
import { createOptions } from './util/create-options.js';
import { getKnownErrors, hasErrorCause, isConfigurationError, isKnownError, isLoaderError, isModuleNotFoundError, } from './util/errors.js';
import { logError } from './util/log.js';
import { perfObserver } from './util/Performance.js';
import { runPreprocessors, runReporters } from './util/reporter.js';
import { prettyMilliseconds } from './util/string.js';
import { version } from './version.js';
let args = {};
try {
    args = parseArgs();
}
catch (error) {
    if (error instanceof Error) {
        console.error(error.message);
        console.log(`\n${helpText}`);
        process.exit(1);
    }
    throw error;
}
const main = async () => {
    try {
        if (args.help) {
            console.log(helpText);
            process.exit(0);
        }
        if (args.version) {
            console.log(version);
            process.exit(0);
        }
        const options = await createOptions({ args });
        const { results } = await run(options);
        const { issues, counters, tagHints, configurationHints, includedWorkspaceDirs, enabledPlugins, selectedWorkspaces, } = results;
        if (options.isWatch || options.isTrace)
            return;
        const initialData = {
            report: options.includedIssueTypes,
            issues,
            counters,
            tagHints,
            configurationHints,
            enabledPlugins,
            includedWorkspaceDirs,
            cwd: options.cwd,
            configFilePath: options.configFilePath,
            isDisableConfigHints: options.isDisableConfigHints,
            isDisableTagHints: options.isDisableTagHints,
            isProduction: options.isProduction,
            isShowProgress: options.isShowProgress,
            isTreatConfigHintsAsErrors: options.isTreatConfigHintsAsErrors,
            isTreatTagHintsAsErrors: options.isTreatTagHintsAsErrors,
            maxShowIssues: options.maxShowIssues,
            options: args['reporter-options'] ?? '',
            preprocessorOptions: args['preprocessor-options'] ?? '',
            selectedWorkspaces,
        };
        const finalData = await runPreprocessors(args.preprocessor ?? [], initialData);
        if (options.isFix)
            await fix(finalData.issues, finalData.counters, options);
        await runReporters(args.reporter ?? ['symbols'], finalData);
        const totalErrorCount = Object.keys(finalData.report)
            .filter(reportGroup => finalData.report[reportGroup] && options.rules[reportGroup] === 'error')
            .reduce((errorCount, reportGroup) => errorCount + finalData.counters[reportGroup], 0);
        if (perfObserver.isEnabled)
            await perfObserver.finalize();
        if (perfObserver.isTimerifyFunctions)
            console.log(`\n${perfObserver.getTimerifiedFunctionsTable()}`);
        if (perfObserver.isMemoryUsageEnabled && !args['memory-realtime'])
            console.log(`\n${perfObserver.getMemoryUsageTable()}`);
        if (perfObserver.isEnabled || perfObserver.isDurationEnabled) {
            const duration = perfObserver.getCurrentDurationInMs();
            console.log('\nTotal running time:', prettyMilliseconds(duration));
            perfObserver.reset();
        }
        if (!args['no-exit-code'] &&
            (totalErrorCount > options.maxIssues ||
                (!options.isDisableConfigHints && options.isTreatConfigHintsAsErrors && configurationHints.length > 0) ||
                (!options.isDisableTagHints && options.isTreatTagHintsAsErrors && tagHints.size > 0))) {
            process.exitCode = 1;
            return;
        }
    }
    catch (error) {
        process.exitCode = 2;
        if (!args.debug && error instanceof Error && isKnownError(error)) {
            const knownErrors = getKnownErrors(error);
            for (const knownError of knownErrors)
                logError(knownError.message);
            if (hasErrorCause(knownErrors[0])) {
                console.error('Reason:', knownErrors[0].cause.message);
                if (isModuleNotFoundError(knownErrors[0].cause))
                    console.log('Module load error? Visit https://knip.dev/reference/known-issues');
                if (isLoaderError(knownErrors[0]))
                    console.log('Configuration file load error? Visit https://knip.dev/reference/known-issues');
            }
            if (isConfigurationError(knownErrors[0]))
                console.log('\nRun `knip --help` or visit https://knip.dev for help');
            process.exitCode = 2;
            return;
        }
        throw error;
    }
    process.exitCode = 0;
};
await main();
