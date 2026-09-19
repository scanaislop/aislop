# verkit

[![Open on npmx][npmx-version-src]][npmx-href]
[![npm downloads][npmx-downloads-src]][npmx-href]
[![Unit Test][unit-test-src]][unit-test-href]

Fast, zero-dependency SemVer for ESM and TypeScript, with functional,
tree-shakeable APIs.

## Features

- ✅ Complete SemVer version and range toolkit.
- 🚀 Faster than [node-semver] across tested operations.
- 📦 Pure ESM with zero runtime dependencies.
- 💙 First-class TypeScript declarations.
- 🌳 Functional, tree-shakeable named exports.
- 🔁 Mutable `SemVer` and `SemVerRange` records.
- ⚡ 26.0% smaller for full CDN imports.
- 🪶 60.1% smaller with common bundled imports.
- 🛡️ Immutable collection operations.

## Install

```bash
npm add verkit
```

## Versions

```ts
import {
  coerce,
  increment,
  normalize,
  normalizeFull,
  parse,
  truncate,
} from 'verkit'

const version = parse('1.2.3-rc.1+sha.abc')
version.patch = 4

normalizeFull(version) // '1.2.4-rc.1+sha.abc'
normalize(version) // '1.2.4-rc.1'
increment(version, 'minor') // '1.3.0'
truncate(version, 'patch') // '1.2.4'
coerce('release 42.6.7.9', { rtl: true }) // '6.7.9'
```

Version APIs accept strings or mutable `SemVer` objects returned by `parse`.
`normalizeFull` keeps build metadata; normalized, incremented, and truncated
versions omit it.

## Comparison

```ts
import { compare, compareBuild, sortReversed } from 'verkit'

compare('1.0.0+one', '1.0.0+two') // 0
compareBuild('1.0.0+one', '1.0.0+two') // -1
sortReversed(['1.0.0', '2.0.0']) // ['2.0.0', '1.0.0']
```

`compare` ignores build metadata; `compareBuild` uses it as a tie-breaker.

## Ranges

```ts
import {
  findMaxSatisfying,
  normalizeRange,
  parseRange,
  satisfies,
} from 'verkit'

const range = parseRange('^1.2.3')

normalizeRange(range) // '>=1.2.3 <2.0.0-0'
satisfies('1.5.0', range) // true
findMaxSatisfying(['1.2.3', '1.5.0', '2.0.0'], range) // '1.5.0'
```

Range APIs accept strings or mutable `SemVerRange` objects. They support
comparators, unions, hyphens, wildcards, tilde, caret, loose parsing, and
prereleases.

## API

See the [API reference](https://npmx.dev/package-docs/verkit).

## Invalid input behavior

`parse` and `parseRange` throw detailed `TypeError`s. Their safe wrappers,
`tryParse` and `tryParseRange`, return `null`; other safe transforms and
predicates keep their documented `null`/`false` behavior.

## Migrating from node-semver

Only renamed or reshaped [node-semver] APIs are listed; same-named functions
such as `clean`, `coerce`, `compare`, and `satisfies` are omitted.

| node-semver                                    | verkit                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `SemVer`                                       | `parse`                                                                                  |
| `parse`                                        | `tryParse`                                                                               |
| `valid`                                        | `normalize`                                                                              |
| `inc`, `diff`                                  | `increment`, `difference`                                                                |
| `major`, `minor`, `patch`, `prerelease`        | `getMajor`, `getMinor`, `getPatch`, `getPrerelease`                                      |
| `rcompare`, `compareLoose`, `cmp`              | `compareReversed`, `compare` with `{ loose: true }`, `compareWithOperator`               |
| `eq`, `neq`, `gt`, `gte`, `lt`, `lte`          | `isEqual`, `isNotEqual`, `isGreater`, `isGreaterOrEqual`, `isLess`, `isLessOrEqual`      |
| `rsort`                                        | `sortReversed`                                                                           |
| `rcompareIdentifiers`                          | `compareIdentifiersReversed`                                                             |
| `Comparator`                                   | `SemVerComparator`, `normalizeComparator`, `satisfiesComparator`, `comparatorsIntersect` |
| `Range`                                        | `parseRange`                                                                             |
| `toComparators`, `validRange`                  | `rangeToComparators`, `normalizeRange`                                                   |
| `maxSatisfying`, `minSatisfying`, `minVersion` | `findMaxSatisfying`, `findMinSatisfying`, `findMinimumForRange`                          |
| `outside`, `gtr`, `ltr`                        | `isOutsideRange`, `isGreaterThanRange`, `isLessThanRange`                                |
| `intersects`, `subset`                         | `rangesIntersect`, `isRangeSubset`                                                       |
| `RELEASE_TYPES`                                | `INCREMENT_TYPES` (also includes `release`)                                              |

`valid` returns a normalized `string | null` in node-semver, so its equivalent
is `normalize`. Use `isValid` when you only need a boolean.

Use options objects such as `{ loose: true }` and `{ identifier, identifierBase }`.

## Differences from node-semver

verkit follows [node-semver] semantics with three user-visible differences:

- Array helpers never mutate their inputs.
- verkit is ESM-only, with no CommonJS, CLI, or `NODE_DEBUG=semver` output.
- Error text, stack traces, and supported runtimes may differ.

## Bundle size

Full package imports, minified with Rolldown:

| Package               | Minified |    gzip |  Brotli |
| --------------------- | -------: | ------: | ------: |
| verkit                | 18,232 B | 5,730 B | 5,215 B |
| [semver][node-semver] | 24,648 B | 7,361 B | 6,708 B |
| verkit reduction      |    26.0% |   22.2% |   22.3% |

Common validation, range, comparison, increment, and coercion imports,
tree-shaken and minified with Rolldown:

| Package               | Minified |    gzip |  Brotli |
| --------------------- | -------: | ------: | ------: |
| verkit                |  9,898 B | 3,384 B | 3,084 B |
| [semver][node-semver] | 24,801 B | 7,432 B | 6,773 B |
| verkit reduction      |    60.1% |   54.5% |   54.5% |

Run `pnpm test:size` to reproduce the comparison.

## Benchmarks

Measured on a MacBook Pro with an Apple M1 Max and 32 GB RAM. Higher is
better.

| Operation                 | verkit ops/s | semver ops/s | Faster       |
| ------------------------- | -----------: | -----------: | ------------ |
| Parse and normalize       |        1.92M |        1.63M | verkit 1.18× |
| Compare                   |        1.60M |        1.13M | verkit 1.41× |
| Compare parsed versions   |       12.83M |        5.93M | verkit 2.16× |
| Increment                 |        1.78M |        1.02M | verkit 1.76× |
| Coerce                    |        1.18M |        1.05M | verkit 1.13× |
| Satisfy uncached ranges   |        0.07M |        0.06M | verkit 1.18× |
| Satisfy pre-parsed inputs |        5.15M |        2.28M | verkit 2.26× |

Range benchmarks either cycle through 1,001 inputs to avoid cache hits or
parse once and reuse the resulting objects.

Run runtime benchmarks with `pnpm bench`.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

[MIT](./LICENSE) © 2026-PRESENT [Kevin Deng](https://github.com/sxzz).

Parts of the implementation and test fixtures are derived from [node-semver]
under the ISC license; see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

<!-- Badges -->

[npmx-version-src]: https://npmx.dev/api/registry/badge/version/verkit
[npmx-downloads-src]: https://npmx.dev/api/registry/badge/downloads-month/verkit
[npmx-href]: https://npmx.dev/verkit
[node-semver]: https://github.com/npm/node-semver
[unit-test-src]: https://github.com/sxzz/verkit/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/sxzz/verkit/actions/workflows/unit-test.yml
