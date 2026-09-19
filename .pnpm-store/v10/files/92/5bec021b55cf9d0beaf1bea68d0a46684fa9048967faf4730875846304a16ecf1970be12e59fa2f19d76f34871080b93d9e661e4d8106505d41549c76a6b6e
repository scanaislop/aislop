import { readFileSync } from 'node:fs';
import { IS_DTS } from '../constants.js';
import { isFile } from '../util/fs.js';
import { _syncGlob } from '../util/glob.js';
import { getDefinitelyTypedFor, getPackageNameFromModuleSpecifier, isDefinitelyTyped, isStartsLikePackageName, sanitizeSpecifier, } from '../util/modules.js';
import { getPublishedTypeManifest, getPublishedTypeEntrySpecifiers, getPublishedTypeExportSpecifiers, isPublishedTypeExportTarget, toDeclarationSpecifier, } from '../util/package-json.js';
import { dirname, join, relative } from '../util/path.js';
import { _resolveDeclarationSync } from '../util/resolve.js';
import { _getImportsAndExports } from './get-imports-and-exports.js';
import { buildVisitor } from './visitors/walk.js';
const options = {
    skipTypeOnly: false,
    isFixExports: false,
    isFixTypes: false,
    isReportExports: false,
    tags: [[], []],
};
const resolveNothing = () => undefined;
const toGlobPattern = (specifier) => {
    const index = specifier.indexOf('*');
    return `${specifier.slice(0, index)}**/*${specifier.slice(index + 1).replaceAll('*', '**')}`;
};
const isInWorkspace = (filePath, workspaceDir) => filePath === workspaceDir || filePath.startsWith(`${workspaceDir}/`);
const toDeclarationPath = (filePath) => {
    if (IS_DTS.test(filePath))
        return filePath;
    const candidate = toDeclarationSpecifier(filePath);
    if (candidate && isFile(candidate))
        return candidate;
};
const getDeclarationPaths = (specifiers, workspaceDir) => {
    const paths = new Set();
    const patterns = [];
    for (const specifier of specifiers) {
        if (specifier.includes('*')) {
            patterns.push(toGlobPattern(specifier));
        }
        else if (IS_DTS.test(specifier)) {
            const filePath = join(workspaceDir, specifier);
            if (isFile(filePath))
                paths.add(filePath);
        }
    }
    if (patterns.length > 0) {
        for (const filePath of _syncGlob({ cwd: workspaceDir, patterns })) {
            if (IS_DTS.test(filePath))
                paths.add(filePath);
        }
    }
    return paths;
};
const getPublishedTypeEntryPaths = (manifest, workspaceDir) => {
    const { candidates, versioned } = getPublishedTypeEntrySpecifiers(manifest);
    const paths = getDeclarationPaths(versioned, workspaceDir);
    for (const specifier of candidates) {
        const filePath = join(workspaceDir, specifier);
        if (!isFile(filePath))
            continue;
        paths.add(filePath);
        break;
    }
    for (const filePath of getDeclarationPaths(getPublishedTypeExportSpecifiers(manifest.exports), workspaceDir)) {
        if (isPublishedTypeExportTarget(manifest.exports, `./${relative(workspaceDir, filePath)}`))
            paths.add(filePath);
    }
    return paths;
};
export const createPublishedTypeDependencyAnalyzer = () => {
    const visitor = buildVisitor([]);
    const packageJsonCache = new Map();
    const packageTypesCache = new Map();
    const loadPackageJson = (filePath) => {
        if (packageJsonCache.has(filePath))
            return packageJsonCache.get(filePath);
        let manifest;
        try {
            manifest = JSON.parse(readFileSync(filePath, 'utf8'));
        }
        catch { }
        packageJsonCache.set(filePath, manifest);
        return manifest;
    };
    const packageProvidesTypes = (packageJsonPath, resolvedPath) => {
        const cached = packageTypesCache.get(packageJsonPath);
        if (cached !== undefined)
            return cached;
        const manifest = loadPackageJson(packageJsonPath);
        const hasTypes = toDeclarationPath(resolvedPath) !== undefined ||
            Boolean(manifest && (manifest.types || manifest.typings || manifest.typesVersions)) ||
            isFile(join(dirname(packageJsonPath), 'index.d.ts'));
        packageTypesCache.set(packageJsonPath, hasTypes);
        return hasTypes;
    };
    const getExternalDependency = (packageName, containingFile, declaredDependencies) => {
        const resolved = _resolveDeclarationSync(packageName, containingFile);
        if (isDefinitelyTyped(packageName))
            return { packageName, isResolved: resolved !== undefined };
        if (resolved?.packageJsonPath) {
            const installedName = loadPackageJson(resolved.packageJsonPath)?.name;
            if (installedName && isDefinitelyTyped(installedName))
                return { packageName: installedName, isResolved: true };
            if (packageProvidesTypes(resolved.packageJsonPath, resolved.path))
                return { packageName, isResolved: true };
        }
        const typesPackageName = getDefinitelyTypedFor(packageName);
        if (_resolveDeclarationSync(typesPackageName, containingFile) || declaredDependencies.has(typesPackageName))
            return { packageName: typesPackageName, isResolved: true };
        return { packageName, isResolved: resolved !== undefined };
    };
    return (workspace, manifest) => {
        const dependencies = [];
        const declaredDependencies = new Set([
            ...Object.keys(manifest.dependencies ?? {}),
            ...Object.keys(manifest.devDependencies ?? {}),
            ...Object.keys(manifest.peerDependencies ?? {}),
            ...Object.keys(manifest.optionalDependencies ?? {}),
        ]);
        const files = getPublishedTypeEntryPaths(getPublishedTypeManifest(manifest), workspace.dir);
        for (const filePath of files) {
            let file;
            try {
                file = _getImportsAndExports(filePath, readFileSync(filePath, 'utf8'), resolveNothing, options, false, true, visitor, undefined);
            }
            catch {
                continue;
            }
            for (const _import of file.imports.unresolved) {
                const specifier = sanitizeSpecifier(_import.specifier);
                const packageName = isStartsLikePackageName(specifier)
                    ? getPackageNameFromModuleSpecifier(specifier)
                    : undefined;
                if (!packageName || packageName === workspace.pkgName) {
                    if (!packageName && !specifier.startsWith('.'))
                        continue;
                    const resolved = _resolveDeclarationSync(specifier, filePath);
                    const declarationPath = resolved && toDeclarationPath(resolved.path);
                    if (declarationPath && isInWorkspace(declarationPath, workspace.dir))
                        files.add(declarationPath);
                    continue;
                }
                const external = getExternalDependency(packageName, filePath, declaredDependencies);
                dependencies.push({
                    containingFilePath: filePath,
                    packageName: external.packageName,
                    specifier,
                    pos: _import.pos,
                    line: _import.line,
                    col: _import.col,
                    isResolved: external.isResolved,
                });
            }
        }
        return dependencies;
    };
};
