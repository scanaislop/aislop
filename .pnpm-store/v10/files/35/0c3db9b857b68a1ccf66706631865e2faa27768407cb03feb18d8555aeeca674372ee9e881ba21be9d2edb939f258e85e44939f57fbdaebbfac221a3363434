import { run } from '../run.js';
import { buildFileDescriptor } from './file-descriptor.js';
import { buildPackageJsonDescriptor } from './package-json-descriptor.js';
export const createSession = async (options) => {
    const { session, results } = await run(options);
    if (!session)
        throw new Error('Unable to initialize watch session');
    return createSessionAdapter(session, results, options);
};
const createSessionAdapter = (session, results, options) => {
    return {
        handleFileChanges: session.handleFileChanges,
        getIssues: session.getIssues,
        getResults: () => results,
        describeFile: (filePath, opts) => buildFileDescriptor(filePath, options.cwd, session.getGraph(), session.getEntryPaths(), opts),
        describePackageJson: () => buildPackageJsonDescriptor(session.getGraph(), session.getEntryPaths()),
    };
};
