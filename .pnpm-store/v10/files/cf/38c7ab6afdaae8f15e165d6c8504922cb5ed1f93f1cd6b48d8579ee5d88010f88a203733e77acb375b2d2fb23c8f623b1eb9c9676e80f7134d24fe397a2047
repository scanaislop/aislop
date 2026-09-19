import { IGNORED_RUNTIME_DEPENDENCIES } from '../constants.js';
import { debugLog } from './debug.js';
import { fromBinary, isBinary, isConfig, isDeferResolve, isDeferResolveEntry, isDependency, toDebugString, } from './input.js';
import { getPackageNameFromSpecifier } from './modules.js';
import { dirname, isAbsolute, isInNodeModules, isInternal, join } from './path.js';
import { _resolveModuleSync, _resolveSync } from './resolve.js';
const isJoinable = (specifier) => {
    const char = specifier.charCodeAt(0);
    return char !== 35 && char !== 126 && char !== 64 && !isAbsolute(specifier);
};
const getWorkspaceFor = (input, chief, workspace) => (input.dir && chief.findWorkspaceByFilePath(`${input.dir}/`)) ||
    (input.containingFilePath && chief.findWorkspaceByFilePath(input.containingFilePath)) ||
    workspace;
const addExternalRef = (map, containingFilePath, ref) => {
    if (!map.has(containingFilePath))
        map.set(containingFilePath, new Set());
    map.get(containingFilePath).add(ref);
};
export const createInputHandler = (deputy, chief, isGitIgnored, addIssue, externalRefs, options) => (input, workspace) => {
    const { specifier, containingFilePath } = input;
    if (!containingFilePath)
        return;
    if (isBinary(input)) {
        const binaryName = fromBinary(input);
        const inputWorkspace = getWorkspaceFor(input, chief, workspace);
        const dependencies = deputy.maybeAddReferencedBinary(inputWorkspace, binaryName);
        if (dependencies) {
            if (externalRefs) {
                for (const dependency of dependencies) {
                    addExternalRef(externalRefs, containingFilePath, { specifier: dependency, identifier: binaryName });
                }
            }
            return;
        }
        if (dependencies || input.optional)
            return;
        addIssue({
            type: 'binaries',
            filePath: containingFilePath,
            workspace: workspace.name,
            symbol: binaryName,
            specifier,
            fixes: [],
        });
        return;
    }
    if (IGNORED_RUNTIME_DEPENDENCIES.has(specifier))
        return;
    const packageName = getPackageNameFromSpecifier(specifier);
    if (packageName &&
        (isDependency(input) ||
            isDeferResolve(input) ||
            (isDeferResolveEntry(input) && isInNodeModules(specifier)) ||
            isConfig(input))) {
        const isWorkspace = chief.workspacesByPkgName.has(packageName);
        const inputWorkspace = getWorkspaceFor(input, chief, workspace);
        if (inputWorkspace) {
            let isHandled = deputy.maybeAddReferencedExternalDependency(inputWorkspace, packageName, {
                specifier,
                isDevOnly: isConfig(input),
                isTypeOnly: input.isTypeOnly,
            });
            if (input.isTypeOnly && input.containingFilePath) {
                const owningWorkspace = chief.findWorkspaceByFilePath(input.containingFilePath);
                if (owningWorkspace && owningWorkspace !== inputWorkspace) {
                    const isOwnerHandled = deputy.maybeAddReferencedExternalDependency(owningWorkspace, packageName, {
                        specifier,
                        isDevOnly: isConfig(input),
                        isTypeOnly: input.isTypeOnly,
                    });
                    isHandled = isHandled || isOwnerHandled;
                }
            }
            if (externalRefs && !isWorkspace) {
                addExternalRef(externalRefs, containingFilePath, { specifier: packageName, identifier: undefined });
            }
            if (isWorkspace || isDependency(input)) {
                if (!isHandled) {
                    if (!input.optional && ((options.isProduction && input.production) || !options.isProduction)) {
                        addIssue({
                            type: 'unlisted',
                            filePath: containingFilePath,
                            workspace: inputWorkspace.name,
                            symbol: packageName,
                            specifier: packageName,
                            fixes: [],
                        });
                    }
                    return;
                }
                const internalPath = _resolveSync(specifier, dirname(containingFilePath));
                if (internalPath && isInternal(internalPath) && !isGitIgnored(internalPath))
                    return internalPath;
            }
            if (isHandled)
                return;
        }
    }
    if (isDeferResolve(input) && deputy.isProduction && !input.production) {
        return;
    }
    const filePath = isJoinable(specifier) ? join(input.dir ?? dirname(containingFilePath), specifier) : specifier;
    const basePath = input.dir ? join(input.dir, 'file.ts') : containingFilePath;
    const resolvedFilePath = _resolveModuleSync(filePath, basePath);
    if (resolvedFilePath && isInternal(resolvedFilePath)) {
        return isGitIgnored(resolvedFilePath) ? undefined : resolvedFilePath;
    }
    if (input.optional)
        return;
    if (!isInternal(filePath)) {
        addIssue({
            type: 'unlisted',
            filePath: containingFilePath,
            workspace: workspace.name,
            symbol: packageName ?? specifier,
            specifier: packageName ?? specifier,
            fixes: [],
        });
    }
    else if (!isGitIgnored(filePath)) {
        if (!isDeferResolveEntry(input) && !isConfig(input)) {
            addIssue({
                type: 'unresolved',
                filePath: containingFilePath,
                workspace: workspace.name,
                symbol: specifier,
                fixes: [],
            });
        }
        else {
            debugLog(workspace.name, `Unable to resolve ${toDebugString(input, options.cwd)}`);
        }
    }
};
