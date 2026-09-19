/**
 * Checks if a file exists and is not ignored by EAS (.easignore) or git (.gitignore).
 * @param filePath The path to the file to check.
 * @param checkEasignore Whether to check .easignore or not (defaults to true).
 * @returns `true` if the file exists and is not ignored.
 */
export declare function existsAndIsNotIgnoredAsync(filePath: string, checkEasignore?: boolean): Promise<boolean>;
/**
 * Checks if a file is ignored by EAS (.easignore) or git (.gitignore).
 * Prioritizes .easignore if it exists, otherwise falls back to .gitignore.
 * @param filePath The path to the file to check.
 * @param checkEasignore Whether to check .easignore or not (defaults to true).
 * @returns `true` if the file is ignored, `false` otherwise.
 */
export declare function isFileIgnoredAsync(filePath: string, checkEasignore?: boolean): Promise<boolean | null>;
