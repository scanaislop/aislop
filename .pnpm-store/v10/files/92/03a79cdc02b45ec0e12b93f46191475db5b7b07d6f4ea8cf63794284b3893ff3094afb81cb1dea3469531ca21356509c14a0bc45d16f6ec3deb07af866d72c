import { isBuiltin } from 'node:module';
import { DT_SCOPE, IGNORE_DEFINITELY_TYPED, IGNORED_DEPENDENCIES, IGNORED_GLOBAL_BINARIES, IGNORED_RUNTIME_DEPENDENCIES, ROOT_WORKSPACE_NAME, } from './constants.js';
import { getDependencyMetaData } from './manifest/index.js';
import { PackagePeeker } from './PackagePeeker.js';
import { getDefinitelyTypedFor, getPackageFromDefinitelyTyped, getPackageNameFromModuleSpecifier, isDefinitelyTyped, } from './util/modules.js';
import { findMatch, toRegexOrString } from './util/regex.js';
const filterIsProduction = (id, isProduction) => typeof id === 'string' ? (isProduction || !id.endsWith('!') ? id.replace(/!$/, '') : []) : id;
export class DependencyDeputy {
    isProduction;
    isStrict;
    isReportDependencies;
    _manifests = new Map();
    workspacePkgNames = new Set();
    referencedDependencies;
    referencedBinaries;
    hostDependencies;
    installedBinaries;
    hasTypesIncluded;
    constructor({ isProduction, isStrict, isReportDependencies }) {
        this.isProduction = isProduction;
        this.isStrict = isStrict;
        this.isReportDependencies = isReportDependencies;
        this.referencedDependencies = new Map();
        this.referencedBinaries = new Map();
        this.hostDependencies = new Map();
        this.installedBinaries = new Map();
        this.hasTypesIncluded = new Map();
    }
    addWorkspace({ name, dir, manifestPath, manifestStr, manifest, ignoreDependencies: id, ignoreBinaries: ib, ignoreUnresolved: iu, }) {
        const dependencies = Object.keys(manifest.dependencies ?? {});
        const peerDependencies = Object.keys(manifest.peerDependencies ?? {});
        const optionalDependencies = Object.keys(manifest.optionalDependencies ?? {});
        const optionalPeerDependencies = new Set();
        if (manifest.peerDependenciesMeta) {
            for (const dep of peerDependencies) {
                if (manifest.peerDependenciesMeta[dep]?.optional)
                    optionalPeerDependencies.add(dep);
            }
        }
        const requiredPeerDependencies = peerDependencies.filter(dep => !optionalPeerDependencies.has(dep));
        const devDependencies = Object.keys(manifest.devDependencies ?? {});
        const allDependencies = [...dependencies, ...devDependencies, ...peerDependencies, ...optionalDependencies];
        const packageNames = [...dependencies, ...peerDependencies, ...(this.isProduction ? [] : devDependencies)];
        if (this.isReportDependencies) {
            const { hostDependencies, installedBinaries, hasTypesIncluded } = getDependencyMetaData({
                packageNames,
                dir,
            });
            this.setHostDependencies(name, hostDependencies);
            this.installedBinaries.set(name, installedBinaries);
            this.hasTypesIncluded.set(name, hasTypesIncluded);
        }
        const ignoreDependencies = id.flatMap(id => filterIsProduction(id, this.isProduction)).map(toRegexOrString);
        const ignoreBinaries = ib.flatMap(ib => filterIsProduction(ib, this.isProduction)).map(toRegexOrString);
        const ignoreUnresolved = iu.map(toRegexOrString);
        this._manifests.set(name, {
            workspaceDir: dir,
            manifestPath,
            manifestStr,
            ignoreDependencies,
            ignoreBinaries,
            ignoreUnresolved,
            unusedIgnoreDependencies: new Set(ignoreDependencies),
            unusedIgnoreBinaries: new Set(ignoreBinaries),
            unusedIgnoreUnresolved: new Set(ignoreUnresolved),
            dependencies,
            devDependencies,
            peerDependencies: new Set(peerDependencies),
            optionalPeerDependencies,
            requiredPeerDependencies,
            allDependencies: new Set(allDependencies),
            engines: manifest.engines ?? {},
            isPrivate: Boolean(manifest.private),
        });
    }
    getWorkspaceManifest(workspaceName) {
        return this._manifests.get(workspaceName);
    }
    setWorkspacePkgNames(pkgNames) {
        this.workspacePkgNames = new Set(pkgNames);
    }
    getProductionDependencies(workspaceName) {
        const manifest = this._manifests.get(workspaceName);
        if (!manifest)
            return [];
        if (this.isStrict)
            return [...manifest.dependencies, ...manifest.requiredPeerDependencies];
        return manifest.dependencies;
    }
    getDevDependencies(workspaceName) {
        return this._manifests.get(workspaceName)?.devDependencies ?? [];
    }
    dependencyCache = new Map();
    getDependencies(workspaceName) {
        let deps = this.dependencyCache.get(workspaceName);
        if (deps)
            return deps;
        const manifest = this._manifests.get(workspaceName);
        deps = manifest ? new Set([...manifest.dependencies, ...manifest.devDependencies]) : new Set();
        this.dependencyCache.set(workspaceName, deps);
        return deps;
    }
    addReferencedDependency(workspaceName, packageName) {
        if (!this.referencedDependencies.has(workspaceName)) {
            this.referencedDependencies.set(workspaceName, new Set());
        }
        this.referencedDependencies.get(workspaceName)?.add(packageName);
    }
    addReferencedBinary(workspaceName, binaryName) {
        if (!this.referencedBinaries.has(workspaceName)) {
            this.referencedBinaries.set(workspaceName, new Set());
        }
        this.referencedBinaries.get(workspaceName)?.add(binaryName);
    }
    setHostDependencies(workspaceName, hostDependencies) {
        this.hostDependencies.set(workspaceName, hostDependencies);
    }
    getHostDependenciesFor(workspaceName, dependency) {
        return this.hostDependencies.get(workspaceName)?.get(dependency) ?? [];
    }
    getOptionalPeerDependencies(workspaceName) {
        return this._manifests.get(workspaceName)?.optionalPeerDependencies ?? new Set();
    }
    maybeAddReferencedExternalDependency(workspace, packageName, { specifier, isDevOnly, isTypeOnly, isResolved, isPublishedType }) {
        if (!this.isReportDependencies)
            return true;
        if (specifier.startsWith('node:') || isBuiltin(specifier))
            return true;
        if (IGNORED_RUNTIME_DEPENDENCIES.has(packageName))
            return true;
        if (packageName === workspace.pkgName)
            return true;
        const workspaceNames = this.isStrict ? [workspace.name] : [workspace.name, ...workspace.ancestors.toReversed()];
        const isDevOrTypeOnly = isDevOnly || (isTypeOnly && !isPublishedType);
        const closestWorkspaceName = workspaceNames.find(name => this.isInDependencies(name, packageName, isDevOrTypeOnly));
        const typesPackageName = !isDefinitelyTyped(packageName) && getDefinitelyTypedFor(packageName);
        const closestWorkspaceNameForTypes = typesPackageName && workspaceNames.find(name => this.isInDependencies(name, typesPackageName, isDevOrTypeOnly));
        if (closestWorkspaceNameForTypes && !this.hasTypesIncluded.get(closestWorkspaceNameForTypes)?.has(packageName))
            this.addReferencedDependency(closestWorkspaceNameForTypes, typesPackageName);
        if (closestWorkspaceName) {
            this.addReferencedDependency(closestWorkspaceName, packageName);
            return true;
        }
        if (closestWorkspaceNameForTypes && isTypeOnly)
            return true;
        if (this._manifests.get(workspace.name)?.engines[packageName])
            return true;
        if (!this.isStrict && this.workspacePkgNames.has(packageName) && this._manifests.get(workspace.name)?.isPrivate) {
            this.addReferencedDependency(workspace.name, packageName);
            return true;
        }
        if (!this.isStrict && isResolved !== false) {
            for (const name of workspaceNames) {
                const hosts = this.getHostDependenciesFor(name, packageName);
                if (hosts.length === 0)
                    continue;
                const m = this._manifests.get(name);
                if (m && hosts.some(h => m.allDependencies.has(h.name))) {
                    this.addReferencedDependency(name, packageName);
                    return true;
                }
            }
        }
        this.addReferencedDependency(workspace.name, packageName);
        return false;
    }
    maybeAddReferencedBinary(workspace, binaryName) {
        if (!this.isReportDependencies)
            return new Set();
        this.addReferencedBinary(workspace.name, binaryName);
        const workspaceNames = this.isStrict ? [workspace.name] : [workspace.name, ...workspace.ancestors.toReversed()];
        for (const name of workspaceNames) {
            const binaries = this.installedBinaries.get(name);
            if (binaries?.has(binaryName)) {
                const dependencies = binaries.get(binaryName);
                if (dependencies?.size) {
                    for (const dependency of dependencies)
                        this.addReferencedDependency(name, dependency);
                    return dependencies;
                }
            }
        }
        if (IGNORED_GLOBAL_BINARIES.has(binaryName))
            return new Set();
        return;
    }
    isInDependencies(workspaceName, packageName, isDevOnly) {
        const manifest = this._manifests.get(workspaceName);
        if (!manifest)
            return false;
        if (this.isStrict && !isDevOnly)
            return this.getProductionDependencies(workspaceName).includes(packageName);
        return manifest.allDependencies.has(packageName);
    }
    settleDependencyIssues() {
        const dependencyIssues = [];
        const devDependencyIssues = [];
        const optionalPeerDependencyIssues = [];
        for (const [workspace, { manifestPath: filePath, manifestStr }] of this._manifests) {
            const referencedDependencies = this.referencedDependencies.get(workspace);
            const hasTypesIncluded = this.hasTypesIncluded.get(workspace);
            const peeker = new PackagePeeker(manifestStr);
            const isReferencedDependency = (dependency, visited = new Set()) => {
                if (referencedDependencies?.has(dependency))
                    return true;
                if (visited.has(dependency))
                    return false;
                visited.add(dependency);
                const [scope, typedDependency] = dependency.split('/');
                if (scope === DT_SCOPE) {
                    const typedPackageName = getPackageFromDefinitelyTyped(typedDependency);
                    if (IGNORE_DEFINITELY_TYPED.has(typedPackageName))
                        return true;
                    if (hasTypesIncluded?.has(typedPackageName))
                        return false;
                    const hostDependencies = [
                        ...this.getHostDependenciesFor(workspace, dependency),
                        ...this.getHostDependenciesFor(workspace, typedPackageName),
                    ];
                    if (hostDependencies.length)
                        return hostDependencies.some(host => isReferencedDependency(host.name, visited));
                    if (!referencedDependencies?.has(dependency))
                        return false;
                    return referencedDependencies.has(typedPackageName);
                }
                const hostDependencies = this.getHostDependenciesFor(workspace, dependency);
                return hostDependencies.some(hostDependency => isReferencedDependency(hostDependency.name, visited));
            };
            const isNotReferencedDependency = (dependency) => !isReferencedDependency(dependency);
            for (const symbol of this.getProductionDependencies(workspace).filter(isNotReferencedDependency)) {
                const position = peeker.getLocation('dependencies', symbol);
                dependencyIssues.push({ type: 'dependencies', workspace, filePath, symbol, fixes: [], ...position });
            }
            const manifest = this._manifests.get(workspace);
            for (const symbol of this.getDevDependencies(workspace)) {
                if (!manifest.dependencies.includes(symbol) && !isNotReferencedDependency(symbol))
                    continue;
                const position = peeker.getLocation('devDependencies', symbol);
                devDependencyIssues.push({ type: 'devDependencies', filePath, workspace, symbol, fixes: [], ...position });
            }
            for (const symbol of this.getOptionalPeerDependencies(workspace)) {
                if (!referencedDependencies?.has(symbol))
                    continue;
                if (manifest.dependencies.includes(symbol) || manifest.devDependencies.includes(symbol))
                    continue;
                const pos = peeker.getLocation('optionalPeerDependencies', symbol);
                optionalPeerDependencyIssues.push({
                    type: 'optionalPeerDependencies',
                    filePath,
                    workspace,
                    symbol,
                    fixes: [],
                    ...pos,
                });
            }
        }
        return { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues };
    }
    handleIgnoredDependencies(issues, counters, type) {
        for (const key in issues[type]) {
            const issueSet = issues[type][key];
            for (const issueKey in issueSet) {
                const issue = issueSet[issueKey];
                const packageName = getPackageNameFromModuleSpecifier(issue.symbol);
                if (!packageName)
                    continue;
                if (IGNORED_DEPENDENCIES.has(packageName)) {
                    if (type === 'devDependencies') {
                        const manifest = this.getWorkspaceManifest(issue.workspace);
                        if (manifest?.dependencies.includes(packageName))
                            continue;
                    }
                    delete issueSet[issueKey];
                    counters[type]--;
                }
                else {
                    const manifest = this.getWorkspaceManifest(issue.workspace);
                    if (manifest) {
                        const ignoreItem = findMatch(manifest.ignoreDependencies, packageName);
                        if (ignoreItem) {
                            delete issueSet[issueKey];
                            counters[type]--;
                            manifest.unusedIgnoreDependencies.delete(ignoreItem);
                        }
                        else if (issue.workspace !== ROOT_WORKSPACE_NAME) {
                            const manifest = this.getWorkspaceManifest(ROOT_WORKSPACE_NAME);
                            if (manifest) {
                                const ignoreItem = findMatch(manifest.ignoreDependencies, packageName);
                                if (ignoreItem) {
                                    delete issueSet[issueKey];
                                    counters[type]--;
                                    manifest.unusedIgnoreDependencies.delete(ignoreItem);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    handleIgnoredBinaries(issues, counters, type) {
        for (const key in issues[type]) {
            const issueSet = issues[type][key];
            for (const issueKey in issueSet) {
                const issue = issueSet[issueKey];
                if (IGNORED_GLOBAL_BINARIES.has(issue.symbol)) {
                    delete issueSet[issueKey];
                    counters[type]--;
                    continue;
                }
                const manifest = this.getWorkspaceManifest(issue.workspace);
                if (manifest) {
                    const ignoreItem = findMatch(manifest.ignoreBinaries, issue.symbol);
                    if (ignoreItem) {
                        delete issueSet[issueKey];
                        counters[type]--;
                        manifest.unusedIgnoreBinaries.delete(ignoreItem);
                    }
                    else {
                        const manifest = this.getWorkspaceManifest(ROOT_WORKSPACE_NAME);
                        if (manifest) {
                            const ignoreItem = findMatch(manifest.ignoreBinaries, issue.symbol);
                            if (ignoreItem) {
                                delete issueSet[issueKey];
                                counters[type]--;
                                manifest.unusedIgnoreBinaries.delete(ignoreItem);
                            }
                        }
                    }
                }
            }
        }
    }
    handleIgnoredUnresolved(issues, counters) {
        for (const key in issues.unresolved) {
            const issueSet = issues.unresolved[key];
            for (const issueKey in issueSet) {
                const issue = issueSet[issueKey];
                const manifest = this.getWorkspaceManifest(issue.workspace);
                if (manifest) {
                    const ignoreItem = findMatch(manifest.ignoreUnresolved, issue.symbol);
                    if (ignoreItem) {
                        delete issueSet[issueKey];
                        counters.unresolved--;
                        manifest.unusedIgnoreUnresolved.delete(ignoreItem);
                    }
                    else {
                        const manifest = this.getWorkspaceManifest(ROOT_WORKSPACE_NAME);
                        if (manifest) {
                            const ignoreItem = findMatch(manifest.ignoreUnresolved, issue.symbol);
                            if (ignoreItem) {
                                delete issueSet[issueKey];
                                counters.unresolved--;
                                manifest.unusedIgnoreUnresolved.delete(ignoreItem);
                            }
                        }
                    }
                }
            }
        }
    }
    removeIgnoredIssues({ issues, counters }) {
        this.handleIgnoredDependencies(issues, counters, 'dependencies');
        this.handleIgnoredDependencies(issues, counters, 'devDependencies');
        this.handleIgnoredDependencies(issues, counters, 'optionalPeerDependencies');
        this.handleIgnoredDependencies(issues, counters, 'unlisted');
        this.handleIgnoredDependencies(issues, counters, 'unresolved');
        this.handleIgnoredBinaries(issues, counters, 'binaries');
        this.handleIgnoredUnresolved(issues, counters);
    }
    getConfigurationHints() {
        const configurationHints = [];
        for (const [workspaceName, manifest] of this._manifests) {
            for (const identifier of manifest.unusedIgnoreDependencies) {
                configurationHints.push({ workspaceName, identifier, type: 'ignoreDependencies' });
            }
            for (const identifier of manifest.unusedIgnoreBinaries) {
                configurationHints.push({ workspaceName, identifier, type: 'ignoreBinaries' });
            }
            for (const identifier of manifest.unusedIgnoreUnresolved) {
                configurationHints.push({ workspaceName, identifier, type: 'ignoreUnresolved' });
            }
        }
        return configurationHints;
    }
    addIgnoredDependencies(workspaceName, identifier) {
        this._manifests.get(workspaceName)?.ignoreDependencies.push(toRegexOrString(identifier));
    }
    addIgnoredBinaries(workspaceName, identifier) {
        this._manifests.get(workspaceName)?.ignoreBinaries.push(toRegexOrString(identifier));
    }
    addIgnoredUnresolved(workspaceName, identifier) {
        this._manifests.get(workspaceName)?.ignoreUnresolved.push(toRegexOrString(identifier));
    }
}
