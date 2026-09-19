import { createOwnershipEngine } from '../util/codeowners.js';
import { isFile } from '../util/fs.js';
import { relative, resolve } from '../util/path.js';
import { convert, flattenIssues } from './util/util.js';
export default async ({ report, issues, options, cwd }) => {
    let opts = {};
    try {
        opts = options ? JSON.parse(options) : opts;
    }
    catch (error) {
        console.error(error);
    }
    const json = {};
    const codeownersFilePath = resolve(opts.codeowners ?? '.github/CODEOWNERS');
    const findOwners = isFile(codeownersFilePath) && createOwnershipEngine(codeownersFilePath);
    const initRow = (filePath) => {
        const file = relative(cwd, filePath);
        const row = {
            file,
            ...(findOwners && { owners: findOwners(file).map(name => ({ name })) }),
            ...(report.binaries && { binaries: [] }),
            ...(report.catalog && { catalog: [] }),
            ...(report.catalogReferences && { catalogReferences: [] }),
            ...(report.cycles && { cycles: [] }),
            ...(report.dependencies && { dependencies: [] }),
            ...(report.devDependencies && { devDependencies: [] }),
            ...(report.duplicates && { duplicates: [] }),
            ...(report.enumMembers && { enumMembers: [] }),
            ...(report.exports && { exports: [] }),
            ...(report.files && { files: [] }),
            ...(report.namespaceMembers && { namespaceMembers: [] }),
            ...(report.nsExports && { nsExports: [] }),
            ...(report.nsTypes && { nsTypes: [] }),
            ...(report.optionalPeerDependencies && { optionalPeerDependencies: [] }),
            ...(report.types && { types: [] }),
            ...(report.unlisted && { unlisted: [] }),
            ...(report.unresolved && { unresolved: [] }),
        };
        return row;
    };
    for (const [type, isReportType] of Object.entries(report)) {
        if (isReportType) {
            for (const issue of flattenIssues(issues[type])) {
                const { filePath, symbol, symbols } = issue;
                json[filePath] = json[filePath] ?? initRow(filePath);
                if (type === 'duplicates' || type === 'cycles') {
                    symbols && json[filePath][type]?.push(symbols.map(convert));
                }
                else if (type === 'binaries') {
                    json[filePath][type]?.push({ name: symbol });
                }
                else {
                    json[filePath][type]?.push(convert(issue));
                }
            }
        }
    }
    const jsonReport = { issues: Object.values(json) };
    const output = JSON.stringify(jsonReport);
    process.stdout._handle?.setBlocking?.(true);
    process.stdout.write(`${output}\n`);
};
