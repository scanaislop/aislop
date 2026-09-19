import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks/checks.types';
interface DoctorCheckRunnerJob {
    check: DoctorCheck;
    result: DoctorCheckResult;
    duration: number;
    error?: Error;
}
export declare function printCheckResultSummaryOnComplete(job: DoctorCheckRunnerJob, showVerboseTestResults: boolean): Promise<void>;
export declare function printFailedCheckIssueAndAdvice(job: DoctorCheckRunnerJob): Promise<void>;
/**
 * Run all commands in parallel. Make a callback as each one finishes.
 * @param checks list of checks to run (do any filtering beforehand)
 * @param checkParams parameters to be passed to each check
 * @param onCheckComplete callback to be called when each check finishes
 * @returns check with its associated results or exception if it failed unexpectedly
 */
export declare function runChecksAsync(checks: DoctorCheck[], checkParams: DoctorCheckParams, onCheckComplete: (checkRunnerJob: DoctorCheckRunnerJob) => void): Promise<DoctorCheckRunnerJob[]>;
/**
 * Run the expo-doctor checks on the project.
 * @param projectRoot The root of the project to check.
 * @param showVerboseTestResults if true, show passes and failures; otherwise show number of tests passed and failure details only
 */
export declare function actionAsync(projectRoot: string, showVerboseTestResults: boolean): Promise<void>;
export {};
