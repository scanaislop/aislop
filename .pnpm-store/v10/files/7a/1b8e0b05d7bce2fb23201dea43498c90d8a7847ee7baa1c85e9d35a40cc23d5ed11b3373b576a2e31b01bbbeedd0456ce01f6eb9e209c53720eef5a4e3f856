# smol-toml
[![TOML 1.1.0](https://img.shields.io/badge/TOML-1.1.0-9c4221?style=flat-square)](https://toml.io/en/v1.1.0)
[![License](https://img.shields.io/github/license/squirrelchat/smol-toml.svg?style=flat-square)](https://github.com/squirrelchat/smol-toml/blob/mistress/LICENSE)
[![npm](https://img.shields.io/npm/v/smol-toml?style=flat-square)](https://npmx.dev/smol-toml)
[![Build](https://img.shields.io/github/actions/workflow/status/squirrelchat/smol-toml/build.yaml?style=flat-square&logo=github)](https://github.com/squirrelchat/smol-toml/actions/workflows/build.yaml)

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-support%20me-EA4AAA?style=flat-square)](https://github.com/sponsors/cyyynthia)
[![Weekly downloads](https://img.shields.io/npm/dw/smol-toml?style=flat-square)](https://npmx.dev/smol-toml)
[![Monthly downloads](https://img.shields.io/npm/dm/smol-toml?style=flat-square)](https://npmx.dev/smol-toml)

A small, fast, and correct TOML parser and serializer. smol-toml is fully(ish) spec-compliant with TOML v1.1.0.

Why yet another TOML parser? Well, the ecosystem of TOML parsers in JavaScript is quite underwhelming, most likely due
to a lack of interest. With most parsers being outdated, unmaintained, non-compliant, or a combination of these, a new
parser didn't feel too out of place.

*[insert xkcd 927]*

Nowadays, smol-toml is the most downloaded TOML parser on npm thanks to its quality. From frameworks to tooling, it
has been battle-tested and is actively used in production systems.

smol-toml passes most of the tests from the [`toml-test` suite](https://github.com/toml-lang/toml-test); use the
`run-toml-test.bash` script to run the tests. Due to the nature of JavaScript and the limits of the language,
it doesn't pass certain tests, namely:
- Invalid UTF-8 strings (and comments) are not rejected
- Certain invalid dates are not rejected
  - For instance, `2023-02-30` would be accepted and parsed as `2023-03-02`. While additional checks could be performed
	to reject these, they've not been added for performance reasons.

Please also note that by default, the behavior regarding integers doesn't preserve type information, nor does it allow
deserializing integers larger than 53 bits. See [Integers](#integers).

You can see a list of all tests smol-toml fails (and the reason why it fails these) in the list of skipped tests in
`run-toml-test.bash`. Note that some failures are *not* specification violations per-se. For instance, the TOML spec
does not require 64-bit integer range support or sub-millisecond time precision, but are included in the `toml-test`
suite. See https://github.com/toml-lang/toml-test/issues/154 and https://github.com/toml-lang/toml-test/issues/155

## Installation
```
[pnpm | yarn | npm] i smol-toml
```

## Usage
```js
import { parse, stringify } from 'smol-toml'

const doc = '...'
const parsed = parse(doc)
console.log(parsed)

const toml = stringify(parsed)
console.log(toml)
```

Alternatively, if you prefer something similar to the JSON global, you can import the library as follows
```js
import * as TOML from 'smol-toml'

TOML.stringify({ ... })
```

A few notes on the `stringify` function:
- `undefined` and `null` values on objects are ignored (does not produce a key/value).
- `undefined` and `null` values in arrays are **rejected**.
- Functions, classes and symbols are **rejected**.
- By default, floats will be serialized as integers if they don't have a decimal part. See [Integers](#integers)
  - `stringify(parse('a = 1.0')) === 'a = 1'`
- JS `Date` will be serialized as Offset Date Time
  - Use the [Temporal API] for representing other types (or alternatively the legacy [`TomlDate` object](#dates)).

### Integers
When parsing, both integers and floats are read as plain JavaScript numbers, which essentially are floats. This means
loss of type information, and makes it impossible to safely represent integers beyond 53 bits.

When serializing, numbers without a decimal part are serialized as integers (except if they're outside of the safe
range; i.e. they cannot be represented as a signed 53-bit integer). This allows in most cases to preserve
whether a number is an integer or not, but fails to preserve type information for numbers like `1.0`.

#### Enabling BigInt support and type preservation
To parse integers beyond 53 bits, it's possible to tell the parser to return all integers as BigInt. This will
therefore preserve the type information at the cost of using a slightly more expensive container.

```js
import { parse } from 'smol-toml'

const doc = '...'
const parsed = parse(doc, { integersAsBigInt: true })
```

If you want to keep numbers for integers that can safely be represented as a JavaScript number, you can pass
`"asNeeded"` instead.

To get end-to-end type preservation, you can tell the serializer to always treat numbers as floating point numbers.
Then, only BigInts will be serialized as integers and numbers without a decimal part will still be serialized as float.

```js
import { stringify } from 'smol-toml'

const obj =  { ... }
const toml = stringify(obj, { numbersAsFloat: true })
```

### Dates
`smol-toml` uses an extended `Date` object to represent all types of TOML Dates. In the future, `smol-toml` will emit
objects from the Temporal API, but for now it only supports `Date` when parsing. When stringifying, `smol-toml` does
support objects from the [Temporal API] and will output the appropriate TOML type.

> [!IMPORTANT]
> If you create a `ZonedDateTime` with a timezone, it will be turned into an offset date-time; losing its precise timezone.
>
> For instance, if you create one with the timezone `Europe/Paris`, it'll be turned into an offset date-time `+02:00`
> or `+01:00`, depending on the offset observed at the instant referred to by the date-time.
>
> ```js
> Temporal.ZonedDateTime.from({ year: 2001, month: 9, day: 21, hour: 10, minute: 17, second: 0, timeZone: 'Europe/Paris' }).toString({ timeZoneName: 'never' })
> // 2001-09-21T10:17:00+02:00
> Temporal.ZonedDateTime.from({ year: 2012, month: 3, day: 19, hour: 8, minute: 0, second: 0, timeZone: 'Europe/Paris' }).toString({ timeZoneName: 'never' })
> // 2012-03-19T08:00:00+01:00
> ```

```js
import { TomlDate } from 'smol-toml'

// Offset Date Time
const date = new TomlDate('1979-05-27T07:32:00.000-08:00')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> true, false, false, false
console.log(date.toISOString()) // ~> 1979-05-27T07:32:00.000-08:00

// Local Date Time
const date = new TomlDate('1979-05-27T07:32:00.000')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> true, false, false, true
console.log(date.toISOString()) // ~> 1979-05-27T07:32:00.000

// Local Date
const date = new TomlDate('1979-05-27')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> false, true, false, true
console.log(date.toISOString()) // ~> 1979-05-27

// Local Time
const date = new TomlDate('07:32:00')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> false, false, true, true
console.log(date.toISOString()) // ~> 07:32:00.000
```

You can also wrap a native `Date` object and specify using different methods depending on the type of date you wish
to represent:

```js
import { TomlDate } from 'smol-toml'

const jsDate = new Date()

const offsetDateTime = TomlDate.wrapAsOffsetDateTime(jsDate)
const localDateTime = TomlDate.wrapAsLocalDateTime(jsDate)
const localDate = TomlDate.wrapAsLocalDate(jsDate)
const localTime = TomlDate.wrapAsLocalTime(jsDate)
```

## Performance
The benchmark is ran using [mitata](https://github.com/evanwashere/mitata).

Parsers and serializers are tested in 2 scenarios: using the example from TOML's homepage and specification, and
using a ~5MB randomly generated[^generator] file.

[^generator]: The TOML generator used can be found [here](https://gist.github.com/cyyynthia/e77c744cb6494dabe37d0182506526b9)

While `fast-toml` is included as it's a challenging candidate, it takes a lot of shortcuts that makes it very fast,
but at the expense of correctness (it has significant defects and does not pass the TOML test suite). `smol-toml` is
almost as fast, without sacrificing correctness. 😎

| **Parse**      | smol-toml@1.7.2    | @iarna/toml@3.0.0 | @ltd/j-toml@1.38.0 | fast-toml@0.5.4   | @std/toml@1.0.11 | toml@5.0.0     | js-toml@2.0.1  | @decimalturn/toml-patch@3.0.2 |
|----------------|--------------------|-------------------|--------------------|-------------------|------------------|----------------|----------------|-------------------------------|
| Spec example   | **4.16 µs/iter**   | 12.13 µs/iter     | 30.44 µs/iter      | 5.01 µs/iter      | 22.34 µs/iter    | 32.28 µs/iter  | 24.71 µs/iter  | 17.07 µs/iter                 |
| ~5MB test file | *113.76 ms/iter*   | *DNF*             | 189.89 ms/iter     | **92.24 ms/iter** | 419.95 ms/iter   | 549.86 ms/iter | 336.03 ms/iter | 186.32 ms/iter                |

| **Stringify**  | smol-toml@1.7.2    | @iarna/toml@3.0.0 | @ltd/j-toml@1.38.0 | fast-toml@0.5.4 | @std/toml@1.0.11 | toml@5.0.0     | js-toml@2.0.1  | @decimalturn/toml-patch@3.0.2 |
|----------------|--------------------|-------------------|--------------------|-----------------|------------------|----------------|----------------|-------------------------------|
| Spec example   | **2.29 µs/iter**   | 8.58 µs/iter      | 89.59 µs/iter      | N/A             | 3.96 µs/iter     | N/A            | 3.69 µs/iter   | N/A[^toml-patch-note]         |
| ~5MB test file | **45.33 ms/iter**  | 130.01 ms/iter    | 928.19 ms/iter     | N/A             | 68.58 ms/iter    | N/A            | 110.26 ms/iter | N/A[^toml-patch-note]         |

[^toml-patch-note]: Stringify performance is not included here, as the library is not meant to be fast, but rather
capable of doing precise non-destructive edits that preserve the entire document's shape and format. Putting it here
wouldn't be fair.

<details>
<summary>Detailed benchmark data</summary>

```
node --expose-gc bench/parse.bench.ts
clk: ~5.52 GHz
cpu: AMD Ryzen 9 9950X3D 16-Core Processor
runtime: node 26.5.0 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
• spec document
------------------------------------------- -------------------------------
smol-toml                      4.16 µs/iter   4.14 µs   █
                       (3.99 µs … 91.94 µs)   4.95 µs  ▂█▃
                    (  1.41 kb … 417.70 kb)   9.63 kb ▁███▅▃▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁
                   4.01 ipc ( 99.54% cache)   19.70 branch misses
         23.81k cycles  95.44k instructions   3.05k c-refs   14.12 c-misses

@iarna/toml                   12.13 µs/iter  12.04 µs  █
                     (11.59 µs … 133.43 µs)  15.94 µs  █▄
                    (  0.00  b … 677.01 kb)  24.08 kb ▃██▄▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.97 ipc ( 99.63% cache)   75.32 branch misses
         68.16k cycles 270.90k instructions  10.39k c-refs   38.82 c-misses

@ltd/j-toml                   30.44 µs/iter  29.57 µs  █
                       (28.19 µs … 1.18 ms)  44.30 µs  █▅
                    (432.00  b … 692.05 kb)  27.57 kb ▂██▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.42 ipc ( 99.37% cache)  284.51 branch misses
        169.50k cycles 579.61k instructions  25.59k c-refs  162.02 c-misses

fast-toml                      5.01 µs/iter   4.98 µs   ▄█
                       (4.75 µs … 90.47 µs)   5.84 µs   ██▃
                    (336.00  b … 302.06 kb)  12.56 kb ▁▅███▆▅▃▂▂▁▁▁▁▁▁▁▁▁▁▁
                   4.40 ipc ( 99.53% cache)   25.73 branch misses
         28.21k cycles 124.23k instructions   3.76k c-refs   17.82 c-misses

deno's @std/toml              22.34 µs/iter  22.15 µs  █▅
                     (20.78 µs … 155.43 µs)  36.68 µs  ██
                    (  1.52 kb … 547.05 kb)  64.73 kb ▂██▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.80 ipc ( 99.53% cache)  111.24 branch misses
        124.05k cycles 471.06k instructions  21.13k c-refs  100.20 c-misses

node-toml                     32.28 µs/iter  31.78 µs  █
                     (30.33 µs … 221.49 µs)  53.65 µs  █
                    (  2.00 kb … 968.27 kb) 109.52 kb ▆█▄▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.89 ipc ( 99.18% cache)  193.02 branch misses
        178.72k cycles 695.61k instructions  29.40k c-refs  240.75 c-misses

js-toml                       24.71 µs/iter  23.17 µs  ▅█
                     (21.20 µs … 731.20 µs)  39.47 µs  ██
                    (744.00  b … 861.36 kb)  92.95 kb ▂██▅▂▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.79 ipc ( 98.12% cache)  205.75 branch misses
        134.81k cycles 510.43k instructions  19.00k c-refs  357.65 c-misses

@decimalturn/toml-patch       17.07 µs/iter  16.85 µs  █▆
                     (15.93 µs … 224.97 µs)  23.30 µs  ██
                    (632.00  b … 635.14 kb)  55.51 kb ▂██▇▃▂▂▂▂▁▁▁▁▁▁▁▁▁▁▁▁
                   3.56 ipc ( 99.37% cache)   73.96 branch misses
         95.58k cycles 339.88k instructions  18.52k c-refs  116.43 c-misses

summary
  smol-toml
   1.2x faster than fast-toml
   2.92x faster than @iarna/toml
   4.1x faster than @decimalturn/toml-patch
   5.37x faster than deno's @std/toml
   5.94x faster than js-toml
   7.31x faster than @ltd/j-toml
   7.76x faster than node-toml

• 5MB document
------------------------------------------- -------------------------------
smol-toml                    113.76 ms/iter 115.67 ms      █     █   █
                    (106.25 ms … 121.53 ms) 118.63 ms ▅    █   ▅ █ ▅ █ ▅  ▅
                    ( 37.31 mb …  49.50 mb)  43.97 mb █▁▁▁▁█▁▁▁█▁█▁█▁█▁█▁▁█
                   2.47 ipc ( 98.58% cache)   3.12M branch misses
        606.38M cycles   1.50G instructions  78.32M c-refs   1.11M c-misses

@iarna/toml                  error: Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z at row 5, col 45, pos 569:
4: NfF6LuAerfn5mDPI7Cp 2qsrB4vGmJTyb5jNubOIBYYWrWlAsrw PX93S57gjb5GEhR8qOU5blDQmwfVJTA YvmJ9cE3cUZU NAJQgAbIdpZLhc4lOs4ZhMEWehhZqXCsVD1YP1vN2GEoM2WX''', 1986-05-27T18:36:13Z, -5460, "2ZAV3fYlb23hf7r7QoftVlicWE2iuwp", 4790.2253 ]
5> SzeC4Me8T = [ 5928.9340, 1991-04-28 19:24:24, 7807, -782.4516, 0b1000011111, "YvXRZKBGle9d51sqE90t8hP" ]
                                               ^
6: SLMvBirT.pmpX1D.9PivpfFBo = 2010-09-29



@ltd/j-toml                  189.89 ms/iter 197.10 ms    ██        █
                    (172.17 ms … 237.08 ms) 210.60 ms ▅ ▅██ ▅  ▅   █      ▅
                    ( 19.71 mb …  56.03 mb)  36.30 mb █▁███▁█▁▁█▁▁▁█▁▁▁▁▁▁█
                   2.41 ipc ( 97.92% cache)   3.88M branch misses
          1.03G cycles   2.49G instructions 143.96M c-refs   3.00M c-misses

fast-toml                     92.24 ms/iter  95.41 ms █      █
                      (88.83 ms … 96.21 ms)  96.00 ms █ ▅  ▅▅█▅         ▅▅▅
                    ( 13.32 mb …  34.90 mb)  24.06 mb █▁█▁▁████▁▁▁▁▁▁▁▁▁███
                   2.90 ipc ( 98.44% cache)   2.44M branch misses
        495.57M cycles   1.44G instructions  56.61M c-refs 881.60k c-misses

deno's @std/toml             419.95 ms/iter 428.09 ms        █
                    (408.44 ms … 434.51 ms) 431.58 ms █      █
                    (182.20 mb … 203.81 mb) 188.26 mb ██▁▁▁█▁█▁▁▁▁▁▁█▁▁██▁█
                   3.28 ipc ( 97.22% cache)   6.72M branch misses
          2.27G cycles   7.46G instructions 215.21M c-refs   5.98M c-misses

node-toml                    549.86 ms/iter 559.64 ms    █         █
                    (527.73 ms … 574.83 ms) 571.47 ms ▅▅ █ ▅   ▅   █ ▅   ▅▅
                    ( 21.62 mb …  74.99 mb)  46.84 mb ██▁█▁█▁▁▁█▁▁▁█▁█▁▁▁██
                   4.24 ipc ( 96.62% cache)   6.29M branch misses
          2.95G cycles  12.49G instructions 236.46M c-refs   7.99M c-misses

js-toml                      336.03 ms/iter 328.58 ms  █
                    (310.28 ms … 431.93 ms) 379.93 ms ▅█   ▅
                    (267.75 mb … 279.44 mb) 273.42 mb ██▁▁▇█▁▁▁▁▁▁▁▁▁▇▁▁▁▁▇
                   2.02 ipc ( 94.74% cache)   5.08M branch misses
          1.65G cycles   3.33G instructions 113.18M c-refs   5.95M c-misses

@decimalturn/toml-patch      186.32 ms/iter 185.91 ms          █  █
                    (178.55 ms … 209.69 ms) 190.20 ms ▅  ▅▅    █ ▅█▅ ▅    ▅
                    ( 22.18 mb …  62.13 mb)  26.09 mb █▁▁██▁▁▁▁█▁███▁█▁▁▁▁█
                   2.90 ipc ( 97.50% cache)   3.72M branch misses
        999.99M cycles   2.90G instructions 120.73M c-refs   3.01M c-misses

summary
  fast-toml
   1.23x faster than smol-toml
   2.02x faster than @decimalturn/toml-patch
   2.06x faster than @ltd/j-toml
   3.64x faster than js-toml
   4.55x faster than deno's @std/toml
   5.96x faster than node-toml
node --expose-gc bench/stringify.bench.ts
clk: ~5.52 GHz
cpu: AMD Ryzen 9 9950X3D 16-Core Processor
runtime: node 26.5.0 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
• spec document
------------------------------------------- -------------------------------
smol-toml                      2.29 µs/iter   2.30 µs      ▅   █
                        (2.26 µs … 2.33 µs)   2.33 µs ▆▆ ▃▆█  ██▃ ▃
                    (  4.28 kb …   4.65 kb)   4.54 kb █████████████▄▆▄▄▁▄▆▄
                   4.45 ipc ( 99.40% cache)    5.23 branch misses
         12.67k cycles  56.39k instructions  909.08 c-refs    5.43 c-misses

@iarna/toml                    8.58 µs/iter   8.57 µs    █
                        (8.54 µs … 8.79 µs)   8.63 µs  ████  █
                    (509.76  b …   1.39 kb) 574.04  b █████▁██▁▁▁▁▁▁▁█▁▁▁▁█
                   3.99 ipc ( 99.30% cache)   24.95 branch misses
         48.05k cycles 191.70k instructions   6.20k c-refs   43.23 c-misses

@ltd/j-toml                   89.59 µs/iter  89.41 µs       █
                     (70.85 µs … 242.29 µs) 127.85 µs       █
                    (  4.02 kb … 375.16 kb)  37.41 kb ▁▁▂▂▁▁█▇▃▁▁▁▁▁▁▁▁▁▁▁▁
                   4.16 ipc ( 99.69% cache)  721.33 branch misses
        495.22k cycles   2.06M instructions  28.23k c-refs   88.81 c-misses

deno's @std/toml               3.96 µs/iter   3.96 µs    █   ▄ ▄
                        (3.91 µs … 4.43 µs)   4.01 µs  ▅██ █▅█ █
                    (803.91  b …   3.95 kb) 965.01  b ▅███▅███▅█▅▅▅▅▁▁▁▁▅▁▅
                   3.85 ipc ( 99.45% cache)   11.59 branch misses
         22.20k cycles  85.43k instructions   3.02k c-refs   16.58 c-misses

js-toml                        3.69 µs/iter   3.71 µs   █ ▄
                        (3.65 µs … 3.82 µs)   3.77 µs  ▅█▅██  █▅█
                    (  6.46 kb …   7.23 kb)   7.10 kb ██████▅████▅▁█▁▁▁▅▁▁▅
                   4.14 ipc ( 98.79% cache)   11.99 branch misses
         20.62k cycles  85.48k instructions   1.97k c-refs   23.80 c-misses

@decimalturn/toml-patch       48.60 µs/iter  48.28 µs  █
                     (45.59 µs … 296.88 µs)  81.95 µs  █
                    (128.00  b … 703.46 kb)  93.31 kb ▆█▇▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   4.05 ipc ( 99.26% cache)  533.40 branch misses
        270.34k cycles   1.09M instructions  37.72k c-refs  278.17 c-misses

summary
  smol-toml
   1.61x faster than js-toml
   1.73x faster than deno's @std/toml
   3.75x faster than @iarna/toml
   21.25x faster than @decimalturn/toml-patch
   39.18x faster than @ltd/j-toml

• 5MB document
------------------------------------------- -------------------------------
smol-toml                     45.33 ms/iter  46.14 ms         █    █
                      (42.89 ms … 48.08 ms)  47.97 ms ▅▅ ▅ ▅  █▅   █ ▅    ▅
                    (  9.41 mb …  35.68 mb)  12.98 mb ██▁█▁█▁▁██▁▁▁█▁█▁▁▁▁█
                   1.98 ipc ( 94.06% cache)   1.62M branch misses
        234.88M cycles 464.38M instructions  12.57M c-refs 746.25k c-misses

@iarna/toml                  130.01 ms/iter 130.79 ms █   █
                    (127.84 ms … 135.01 ms) 132.06 ms █  ▅█ ▅▅     ▅▅   ▅ ▅
                    ( 23.69 mb …  51.95 mb)  41.55 mb █▁▁██▁██▁▁▁▁▁██▁▁▁█▁█
                   2.54 ipc ( 96.96% cache)   4.31M branch misses
        707.33M cycles   1.80G instructions  73.12M c-refs   2.22M c-misses

@ltd/j-toml                  928.19 ms/iter 933.90 ms                     █
                    (903.30 ms … 940.61 ms) 934.55 ms               █     █
                    (  1.89 mb …  32.62 mb)  12.57 mb █▁▁▁▁▁▁▁▁▁▁█▁▁██▁████
                   4.02 ipc ( 99.15% cache)   7.29M branch misses
          5.09G cycles  20.45G instructions 194.29M c-refs   1.66M c-misses

deno's @std/toml              68.58 ms/iter  70.20 ms      █
                      (63.51 ms … 78.12 ms)  75.83 ms ▅    █
                    ( 29.19 mb …  62.19 mb)  33.69 mb █▁▁▇▁█▇▁▁▁▁▇▁▁▇▁▁▁▁▁▇
                   2.14 ipc ( 94.82% cache)   1.78M branch misses
        341.59M cycles 731.18M instructions  26.60M c-refs   1.38M c-misses

js-toml                      110.26 ms/iter 111.58 ms    █
                    (106.23 ms … 118.30 ms) 116.43 ms    █
                    ( 31.58 mb …  62.06 mb)  43.79 mb ▇▁▇█▇▇▁▁▁▁▇▁▁▁▁▁▁▇▁▁▇
                   2.29 ipc ( 96.17% cache)   3.09M branch misses
        596.81M cycles   1.36G instructions  41.90M c-refs   1.60M c-misses

@decimalturn/toml-patch      933.72 ms/iter 950.61 ms █               █   █
                    (898.60 ms … 969.27 ms) 955.92 ms █    ▅ ▅▅  ▅    █ ▅ █
                    (119.41 mb … 147.95 mb) 122.51 mb █▁▁▁▁█▁██▁▁█▁▁▁▁█▁█▁█
                   3.20 ipc ( 93.32% cache)  12.50M branch misses
          5.05G cycles  16.18G instructions 694.63M c-refs  46.41M c-misses

summary
  smol-toml
   1.51x faster than deno's @std/toml
   2.43x faster than js-toml
   2.87x faster than @iarna/toml
   20.48x faster than @ltd/j-toml
   20.6x faster than @decimalturn/toml-patch
```

</details>

[Temporal API]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal
