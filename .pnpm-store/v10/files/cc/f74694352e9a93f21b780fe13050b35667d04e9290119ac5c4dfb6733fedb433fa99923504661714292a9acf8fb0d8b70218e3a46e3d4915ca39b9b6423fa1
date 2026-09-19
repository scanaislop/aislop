//#region src/types.d.ts
interface VersionOptions {
  loose?: boolean;
}
interface RangeOptions extends VersionOptions {
  includePrerelease?: boolean;
}
interface CoerceOptions extends VersionOptions {
  includePrerelease?: boolean;
  rtl?: boolean;
}
interface IncrementOptions extends VersionOptions {
  identifier?: string;
  identifierBase?: 0 | 1 | false;
}
type PrereleaseIdentifier = number | string;
interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: PrereleaseIdentifier[] | undefined;
  build?: string[] | undefined;
}
interface SemVerComparator {
  operator: "" | "<" | "<=" | ">" | ">=";
  options: RangeOptions;
  value: string;
  version: SemVer | null;
}
type VersionInput = SemVer | string;
type Comparison = -1 | 0 | 1;
type ComparisonOperator = "" | "!=" | "!==" | "<" | "<=" | "=" | "==" | "===" | ">" | ">=";
type RangeDirection = "<" | ">";
type IncrementType = "major" | "minor" | "patch" | "premajor" | "preminor" | "prepatch" | "prerelease" | "release";
type TruncationType = Exclude<IncrementType, "release">;
type VersionDifference = "major" | "minor" | "patch" | "premajor" | "preminor" | "prepatch" | "prerelease";
//#endregion
//#region src/comparator.d.ts
declare function normalizeComparator(comparator: string, options?: RangeOptions): string;
declare function satisfiesComparator(version: VersionInput, comparator: string, options?: RangeOptions): boolean;
declare function comparatorsIntersect(left: string, right: string, options?: RangeOptions): boolean;
//#endregion
//#region src/comparison.d.ts
declare function compare(left: VersionInput, right: VersionInput, options?: VersionOptions): Comparison;
declare function compareReversed(left: VersionInput, right: VersionInput, options?: VersionOptions): Comparison;
declare function compareMain(left: VersionInput, right: VersionInput, options?: VersionOptions): Comparison;
declare function comparePrerelease(left: VersionInput, right: VersionInput, options?: VersionOptions): Comparison;
declare function compareBuild(left: VersionInput, right: VersionInput, options?: VersionOptions): Comparison;
declare function compareWithOperator(left: VersionInput, operator: ComparisonOperator, right: VersionInput, options?: VersionOptions): boolean;
declare function isEqual(left: VersionInput, right: VersionInput, options?: VersionOptions): boolean;
declare function isNotEqual(left: VersionInput, right: VersionInput, options?: VersionOptions): boolean;
declare function isGreater(left: VersionInput, right: VersionInput, options?: VersionOptions): boolean;
declare function isGreaterOrEqual(left: VersionInput, right: VersionInput, options?: VersionOptions): boolean;
declare function isLess(left: VersionInput, right: VersionInput, options?: VersionOptions): boolean;
declare function isLessOrEqual(left: VersionInput, right: VersionInput, options?: VersionOptions): boolean;
declare function sort<T extends VersionInput>(versions: readonly T[], options?: VersionOptions): T[];
declare function sortReversed<T extends VersionInput>(versions: readonly T[], options?: VersionOptions): T[];
//#endregion
//#region src/constants.d.ts
declare const SEMVER_SPEC_VERSION: string;
declare const INCREMENT_TYPES: readonly IncrementType[];
declare const TRUNCATION_TYPES: readonly TruncationType[];
//#endregion
//#region src/identifiers.d.ts
declare function compareIdentifiers(left: PrereleaseIdentifier, right: PrereleaseIdentifier): Comparison;
declare function compareIdentifiersReversed(left: PrereleaseIdentifier, right: PrereleaseIdentifier): Comparison;
//#endregion
//#region src/internal/range.d.ts
interface SemVerRange {
  normalized: string;
  options: RangeOptions;
  raw: string;
  sets: SemVerComparator[][];
}
type RangeInput = SemVerRange | string;
declare function parseRange(range: RangeInput, options?: RangeOptions): SemVerRange;
declare function tryParseRange(range: RangeInput, options?: RangeOptions): SemVerRange | null;
//#endregion
//#region src/range.d.ts
declare function isValidRange(range: RangeInput, options?: RangeOptions): boolean;
declare function normalizeRange(range: RangeInput, options?: RangeOptions): string | null;
declare function satisfies(version: VersionInput, range: RangeInput, options?: RangeOptions): boolean;
declare function rangeToComparators(range: RangeInput, options?: RangeOptions): string[][];
declare function findMaxSatisfying<T extends VersionInput>(versions: readonly T[], range: RangeInput, options?: RangeOptions): T | null;
declare function findMinSatisfying<T extends VersionInput>(versions: readonly T[], range: RangeInput, options?: RangeOptions): T | null;
declare function findMinimumForRange(range: RangeInput, options?: RangeOptions): string | null;
declare function isOutsideRange(version: VersionInput, range: RangeInput, direction: RangeDirection, options?: RangeOptions): boolean;
declare function isGreaterThanRange(version: VersionInput, range: RangeInput, options?: RangeOptions): boolean;
declare function isLessThanRange(version: VersionInput, range: RangeInput, options?: RangeOptions): boolean;
declare function rangesIntersect(left: RangeInput, right: RangeInput, options?: RangeOptions): boolean;
declare function simplifyRange<T extends VersionInput>(versions: readonly T[], range: RangeInput, options?: RangeOptions): string;
declare function isRangeSubset(subset: RangeInput, superset: RangeInput, options?: RangeOptions): boolean;
//#endregion
//#region src/internal/version.d.ts
declare function parse(version: VersionInput, options?: VersionOptions): SemVer;
declare function tryParse(version: VersionInput, options?: VersionOptions): SemVer | null;
//#endregion
//#region src/version.d.ts
declare function isValid(version: VersionInput, options?: VersionOptions): boolean;
declare function normalizeFull(version: VersionInput, options?: VersionOptions): string | null;
declare function normalize(version: VersionInput, options?: VersionOptions): string | null;
declare function clean(version: VersionInput, options?: VersionOptions): string | null;
declare function coerce(value: number | VersionInput, options?: CoerceOptions): string | null;
declare function increment(version: VersionInput, release: IncrementType, options?: IncrementOptions): string | null;
declare function truncate(version: VersionInput, truncation: TruncationType, options?: VersionOptions): string | null;
declare function difference(left: VersionInput, right: VersionInput): VersionDifference | null;
declare function getMajor(version: VersionInput, options?: VersionOptions): number;
declare function getMinor(version: VersionInput, options?: VersionOptions): number;
declare function getPatch(version: VersionInput, options?: VersionOptions): number;
declare function getPrerelease(version: VersionInput, options?: VersionOptions): PrereleaseIdentifier[] | null;
declare function getBuild(version: VersionInput, options?: VersionOptions): string[] | null;
//#endregion
export { type CoerceOptions, type Comparison, type ComparisonOperator, INCREMENT_TYPES, type IncrementOptions, type IncrementType, type PrereleaseIdentifier, type RangeDirection, type RangeInput, type RangeOptions, SEMVER_SPEC_VERSION, type SemVer, type SemVerComparator, type SemVerRange, TRUNCATION_TYPES, type TruncationType, type VersionDifference, type VersionInput, type VersionOptions, clean, coerce, comparatorsIntersect, compare, compareBuild, compareIdentifiers, compareIdentifiersReversed, compareMain, comparePrerelease, compareReversed, compareWithOperator, difference, findMaxSatisfying, findMinSatisfying, findMinimumForRange, getBuild, getMajor, getMinor, getPatch, getPrerelease, increment, isEqual, isGreater, isGreaterOrEqual, isGreaterThanRange, isLess, isLessOrEqual, isLessThanRange, isNotEqual, isOutsideRange, isRangeSubset, isValid, isValidRange, normalize, normalizeComparator, normalizeFull, normalizeRange, parse, parseRange, rangeToComparators, rangesIntersect, satisfies, satisfiesComparator, simplifyRange, sort, sortReversed, truncate, tryParse, tryParseRange };