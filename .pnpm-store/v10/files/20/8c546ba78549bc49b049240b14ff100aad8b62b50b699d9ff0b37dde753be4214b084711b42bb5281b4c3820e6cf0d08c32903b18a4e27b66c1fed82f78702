import { z } from 'zod/mini';
import { SYMBOL_TYPE } from '../constants.js';
import { globSchema, pluginsSchema } from './plugins.js';
const pathsSchema = z.record(z.string(), z.array(z.string()));
const syncCompilerSchema = z.union([z.literal(true), z.custom()]);
const asyncCompilerSchema = z.custom();
const compilerSchema = z.union([syncCompilerSchema, asyncCompilerSchema]);
const compilersSchema = z.record(z.string(), compilerSchema);
const stringOrRegexSchema = z.array(z.union([z.string(), z.instanceof(RegExp)]));
const issueTypeSchema = z.union([
    z.literal('files'),
    z.literal('dependencies'),
    z.literal('devDependencies'),
    z.literal('optionalPeerDependencies'),
    z.literal('unlisted'),
    z.literal('binaries'),
    z.literal('unresolved'),
    z.literal('exports'),
    z.literal('types'),
    z.literal('nsExports'),
    z.literal('nsTypes'),
    z.literal('duplicates'),
    z.literal('enumMembers'),
    z.literal('namespaceMembers'),
    z.literal('catalog'),
    z.literal('catalogReferences'),
    z.literal('cycles'),
]);
const rulesSchema = z.partialRecord(issueTypeSchema, z.enum(['error', 'warn', 'off']));
const ignorableSymbolTypes = Object.values(SYMBOL_TYPE).filter(type => type !== 'unknown');
const ignoreExportsUsedInFileObjectSchema = z.strictObject(Object.fromEntries(ignorableSymbolTypes.map(type => [type, z.optional(z.boolean())])));
const ignoreExportsUsedInFileSchema = z.union([z.boolean(), ignoreExportsUsedInFileObjectSchema]);
const ignoreIssuesSchema = z.record(z.string(), z.array(issueTypeSchema));
const cyclesSchema = z.strictObject({
    allow: z.optional(z.array(z.array(z.string()))),
    dynamicImports: z.optional(z.boolean()),
});
const rootConfigurationSchema = z.object({
    $schema: z.optional(z.string()),
    rules: z.optional(rulesSchema),
    entry: z.optional(globSchema),
    project: z.optional(globSchema),
    paths: z.optional(pathsSchema),
    ignore: z.optional(globSchema),
    ignoreFiles: z.optional(globSchema),
    ignoreBinaries: z.optional(stringOrRegexSchema),
    ignoreDependencies: z.optional(stringOrRegexSchema),
    ignoreMembers: z.optional(stringOrRegexSchema),
    ignoreUnresolved: z.optional(stringOrRegexSchema),
    ignoreExportsUsedInFile: z.optional(ignoreExportsUsedInFileSchema),
    ignoreIssues: z.optional(ignoreIssuesSchema),
    cycles: z.optional(cyclesSchema),
    ignoreWorkspaces: z.optional(z.array(z.string())),
    includeEntryExports: z.optional(z.boolean()),
    compilers: z.optional(compilersSchema),
    syncCompilers: z.optional(z.record(z.string(), syncCompilerSchema)),
    asyncCompilers: z.optional(z.record(z.string(), asyncCompilerSchema)),
    tags: z.optional(z.array(z.string())),
    treatConfigHintsAsErrors: z.optional(z.boolean()),
    treatTagHintsAsErrors: z.optional(z.boolean()),
});
const reportConfigSchema = z.object({
    include: z.optional(z.array(issueTypeSchema)),
    exclude: z.optional(z.array(issueTypeSchema)),
});
const baseWorkspaceConfigurationSchema = z.object({
    entry: z.optional(globSchema),
    project: z.optional(globSchema),
    paths: z.optional(pathsSchema),
    ignore: z.optional(globSchema),
    ignoreFiles: z.optional(globSchema),
    ignoreBinaries: z.optional(stringOrRegexSchema),
    ignoreDependencies: z.optional(stringOrRegexSchema),
    ignoreMembers: z.optional(stringOrRegexSchema),
    ignoreUnresolved: z.optional(stringOrRegexSchema),
    ignoreExportsUsedInFile: z.optional(ignoreExportsUsedInFileSchema),
    ignoreIssues: z.optional(ignoreIssuesSchema),
    includeEntryExports: z.optional(z.boolean()),
});
const partialPluginsSchema = z.partial(pluginsSchema);
export const workspaceConfigurationSchema = z.strictObject({
    ...baseWorkspaceConfigurationSchema.shape,
    ...partialPluginsSchema.shape,
});
const workspacesConfigurationSchema = z.object({
    workspaces: z.optional(z.record(z.string(), workspaceConfigurationSchema)),
});
export const knipConfigurationSchema = z.strictObject({
    ...rootConfigurationSchema.shape,
    ...reportConfigSchema.shape,
    ...workspacesConfigurationSchema.shape,
    ...partialPluginsSchema.shape,
});
