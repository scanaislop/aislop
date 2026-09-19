import { partitionCompilers } from '../compilers/index.js';
import { ISSUE_TYPES, KNIP_CONFIG_LOCATIONS } from '../constants.js';
import { knipConfigurationSchema } from '../schema/configuration.js';
import { getCatalogContainer } from './catalog.js';
import { parseNumericOption } from './cli-arguments.js';
import { ConfigurationError } from './errors.js';
import { findFile, loadJSON } from './fs.js';
import { getIncludedIssueTypes, shorthandCycles, shorthandDeps, shorthandExports, shorthandFiles, } from './get-included-issue-types.js';
import { defaultRules } from './issue-initializers.js';
import { loadResolvedConfigFile } from './load-config.js';
import { _load } from './loader.js';
import { logWarning } from './log.js';
import { getKeysByValue } from './object.js';
import { isAbsolute, join, normalize, toAbsolute, toPosix } from './path.js';
import { splitTags } from './tag.js';
export const createOptions = async (options) => {
    const { args = {} } = options;
    const pcwd = toPosix(process.cwd());
    const cwd = normalize(toAbsolute(toPosix(options.cwd ?? args.directory ?? pcwd), pcwd));
    const manifestPath = findFile(cwd, 'package.json');
    const manifest = manifestPath && (await loadJSON(manifestPath));
    if (!(manifestPath && manifest)) {
        throw new ConfigurationError('Unable to find package.json');
    }
    let configFilePath;
    for (const configPath of args.config ? [args.config] : KNIP_CONFIG_LOCATIONS) {
        const resolvedConfigFilePath = isAbsolute(configPath) ? configPath : findFile(cwd, configPath);
        if (resolvedConfigFilePath) {
            configFilePath = resolvedConfigFilePath;
            break;
        }
    }
    if (args.config && !configFilePath && !manifest.knip) {
        throw new ConfigurationError(`Unable to find ${args.config} or package.json#knip`);
    }
    const loadedConfig = Object.assign({}, manifest.knip, configFilePath ? await loadResolvedConfigFile(configFilePath, args) : {});
    const validIssueTypes = new Set(ISSUE_TYPES);
    for (const key of ['rules', 'include', 'exclude']) {
        const value = loadedConfig[key];
        if (!value)
            continue;
        if (Array.isArray(value)) {
            const invalid = value.filter((v) => !validIssueTypes.has(v));
            if (invalid.length > 0) {
                loadedConfig[key] = value.filter((v) => validIssueTypes.has(v));
                for (const name of invalid)
                    logWarning(`Ignored unknown issue type "${name}" in ${key}`);
            }
        }
        else if (typeof value === 'object') {
            for (const name in value) {
                if (!validIssueTypes.has(name)) {
                    delete value[name];
                    logWarning(`Ignored unknown issue type "${name}" in ${key}`);
                }
            }
        }
    }
    const parsedConfig = knipConfigurationSchema.parse(partitionCompilers(loadedConfig));
    if (!configFilePath && manifest.knip)
        configFilePath = manifestPath;
    const pnpmWorkspacePath = findFile(cwd, 'pnpm-workspace.yaml');
    const pnpmWorkspace = pnpmWorkspacePath && (await _load(pnpmWorkspacePath));
    const workspaces = pnpmWorkspace?.packages ??
        (manifest.workspaces
            ? Array.isArray(manifest.workspaces)
                ? manifest.workspaces
                : (manifest.workspaces.packages ?? [])
            : []);
    const isStrict = options.isStrict ?? args.strict ?? false;
    const isProduction = options.isProduction ?? args.production ?? isStrict;
    const isDebug = args.debug ?? false;
    const isTrace = Boolean(args.trace ?? args['trace-file'] ?? args['trace-export'] ?? args['trace-dependency']);
    const rules = { ...defaultRules, ...parsedConfig.rules };
    const excludesFromRules = getKeysByValue(rules, 'off');
    const includedIssueTypes = getIncludedIssueTypes({
        isProduction,
        exclude: [...excludesFromRules, ...(parsedConfig.exclude ?? [])],
        include: parsedConfig.include ?? [],
        excludeOverrides: options.excludedIssueTypes ?? args.exclude ?? [],
        includeOverrides: [
            ...(options.includedIssueTypes ?? args.include ?? []),
            ...(args.dependencies ? shorthandDeps : []),
            ...(args.exports ? shorthandExports : []),
            ...(args.files ? shorthandFiles : []),
            ...(args.cycles ? shorthandCycles : []),
        ],
    });
    for (const [key, value] of Object.entries(includedIssueTypes)) {
        if (!value)
            rules[key] = 'off';
    }
    const fixTypes = (options.fixTypes ?? args['fix-type'] ?? []).flatMap(type => type.split(','));
    const isFixFiles = args['allow-remove-files'] && (fixTypes.length === 0 || fixTypes.includes('files'));
    const tags = splitTags(args.tags ?? options.tags ?? parsedConfig.tags ?? []);
    const workspace = options.workspace ?? args.workspace;
    return {
        cacheLocation: args['cache-location'] ?? join(cwd, 'node_modules', '.cache', 'knip'),
        catalog: await getCatalogContainer(cwd, manifest, manifestPath, pnpmWorkspacePath, pnpmWorkspace),
        config: args.config,
        configFilePath,
        cwd,
        cycles: args.cycles ?? false,
        dependencies: args.dependencies ?? false,
        exports: args.exports ?? false,
        files: args.files ?? false,
        fixTypes,
        gitignore: args['no-gitignore'] ? false : (options.gitignore ?? true),
        includedIssueTypes,
        isCache: args.cache ?? false,
        isDebug,
        isDisableConfigHints: args['no-config-hints'] || isProduction,
        isDisableTagHints: Boolean(args['no-tag-hints']),
        isFix: args.fix ?? options.isFix ?? isFixFiles ?? fixTypes.length > 0,
        isFixCatalog: fixTypes.length === 0 || fixTypes.includes('catalog'),
        isFixDependencies: fixTypes.length === 0 || fixTypes.includes('dependencies'),
        isFixFiles,
        isFixUnusedExports: fixTypes.length === 0 || fixTypes.includes('exports'),
        isFixUnusedTypes: fixTypes.length === 0 || fixTypes.includes('types'),
        isFormat: args.format ?? options.isFormat ?? false,
        isIncludeEntryExports: args['include-entry-exports'] ?? options.isIncludeEntryExports ?? false,
        isProduction,
        isReportDependencies: includedIssueTypes.dependencies ||
            includedIssueTypes.unlisted ||
            includedIssueTypes.unresolved ||
            includedIssueTypes.binaries,
        isReportExports: includedIssueTypes.exports ||
            includedIssueTypes.types ||
            includedIssueTypes.nsExports ||
            includedIssueTypes.nsTypes ||
            includedIssueTypes.enumMembers ||
            includedIssueTypes.namespaceMembers ||
            includedIssueTypes.duplicates,
        isReportCycles: includedIssueTypes.cycles,
        isReportFiles: includedIssueTypes.files,
        isReportTypes: includedIssueTypes.types ||
            includedIssueTypes.nsTypes ||
            includedIssueTypes.enumMembers ||
            includedIssueTypes.namespaceMembers,
        isReportValues: includedIssueTypes.exports || includedIssueTypes.nsExports,
        isSession: options.isSession ?? false,
        isShowProgress: !isDebug &&
            !isTrace &&
            args['no-progress'] !== true &&
            options.isShowProgress !== false &&
            process.stdout.isTTY &&
            typeof process.stdout.cursorTo === 'function',
        isStrict,
        isTrace,
        isTreatConfigHintsAsErrors: args['treat-config-hints-as-errors'] ?? parsedConfig.treatConfigHintsAsErrors ?? false,
        isTreatTagHintsAsErrors: args['treat-tag-hints-as-errors'] ?? parsedConfig.treatTagHintsAsErrors ?? false,
        isUseTscFiles: options.isUseTscFiles ?? args['use-tsconfig-files'] ?? (options.isSession && !configFilePath),
        isWatch: args.watch ?? options.isWatch ?? false,
        maxIssues: parseNumericOption(args['max-issues'], 'max-issues') ?? 0,
        maxShowIssues: parseNumericOption(args['max-show-issues'], 'max-show-issues'),
        parsedConfig,
        rules,
        tags,
        traceDependency: args['trace-dependency'],
        traceExport: args['trace-export'],
        traceFile: args['trace-file'] ? toAbsolute(args['trace-file'], cwd) : undefined,
        tsConfigFile: args.tsConfig,
        workspace,
        workspaces,
    };
};
