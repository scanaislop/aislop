# unbash

Fast 0-deps bash parser written in TypeScript

[![NPM Version][2]][1] [![NPM Downloads][3]][1]

## Install

```sh
npm install unbash
```

## When to use unbash?

Use unbash when your input is Bash source: a pasted command, a complete script,
or shell source embedded in another format, and you need to inspect its
structure without executing it. It returns a typed, source-positioned AST.

Example use cases:

- Classify commands, redirects, substitutions, and background execution for
  permission prompts, allowlists, or audit findings
- Statically inventory executables and literal file, configuration, and
  dependency references in package scripts, CI steps, task-runner configs,
  hooks, and source-code shell calls
- Import or convert a supported command such as `curl` without folding
  neighboring pipelines, logical chains, redirects, or comments into its
  arguments
- Attach diagnostics to generated or pasted Bash using source-positioned errors
  and partial trees
- Build explanations, visualizations, or structured previews of pipelines,
  conditions, expansions, and nested commands
- Find or migrate command invocations and flags with source-range edits that
  leave surrounding formatting and comments untouched

When Bash is embedded in JSON, YAML, or source code, use the host-language
parser to extract the shell string first. unbash provides Bash structure and
source ranges within that string; the consumer owns command-specific argument
semantics and policy.

## Supported syntax

unbash supports commands, control flows, pipelines, redirects, assignments,
compound statements, parameter and word expansions, process and nested
substitutions, coproc, heredocs, herestrings, nested and generated syntax, etc.

Nested commands remain structured inside parameter operands and array indexes,
arithmetic expressions, brace expansions, extglobs, redirect targets, and
heredoc bodies. Nodes retain source positions and words retain both raw text and
dequoted values.

Malformed and incomplete input returns a best-effort partial AST with detected,
source-positioned errors. Recovery is bounded for deeply nested parameter and
arithmetic expansions, substitutions, subshells, braces, conditionals, loops,
`select`, `case`, and `[[ ]]` groups.

unbash does not execute code, perform shell expansion, provide a sandbox, or
decide whether a command is safe. Security-sensitive consumers must inspect word
parts, nested scripts, and errors on each parsed script. unbash is a tolerant
parser: for malformed or incomplete input, it recovers where possible and
returns a best-effort partial AST with source-positioned errors. It does not
target PowerShell, `cmd.exe`, or other shell languages. Much POSIX `sh` syntax
is also valid Bash.

To parse `process.argv` (`string[]`), use Node.js [`parseArgs`][4] or a CLI
library such as [yargs][5] or [citty][6].

## Usage

```ts
import { parse } from "unbash";

const ast = parse('if [ -f "$1" ]; then cat "$1"; fi');
```

Result:

```js
{
  type: "Script",
  commands: [{
    type: "Statement",
    command: {
      type: "If",
      clause: { type: "CompoundList", commands: [ /* [ -f "$1" ] */ ] },
      then: { type: "CompoundList", commands: [ /* cat "$1" */ ] }
    }
  }]
}
```

See the full AST at [unbash.statichost.page#input=if \[ -f...][7]

### Word parts

A `Word` holds its expansions in `parts`. This is a lazy getter, computed on
first access (not an own enumerable property):

```js
const word = parse("echo a$(id)b").commands[0].command.suffix[0];

word.parts; // [Literal, CommandExpansion, Literal]

Object.keys(word); // ["text", "pos", "end"] — no `parts`
({ ...word }); // same
structuredClone(word); // same
```

Read `parts` directly, or serialize with `JSON.stringify`, which includes it
through `toJSON`. A generic walker driven by `Object.keys` finds no expansions
at all, and reports no error while doing so:

```js
import { parse } from "unbash";

const script = parse('echo "$HOME" $(mktemp)');

for (const statement of script.commands) {
  const command = statement.command;
  if (command.type !== "Command") continue;
  for (const word of [command.name, ...command.suffix]) {
    for (const part of word?.parts ?? []) {
      if (part.type === "CommandExpansion") console.log(part.text);
    }
  }
}
// $(mktemp)
```

Word-like fields that can execute nested shell syntax expose the same structure.
`BraceExpansion`, `ExtendedGlob`, and `ArithmeticWord` use `parts`; parameter
and assignment array indexes use `indexParts`.

Positions are zero-based UTF-16 code-unit offsets forming half-open `[pos, end)`
ranges in the source owned by the nearest `ParsedScript`. Root scripts and
verbatim nested substitutions share the caller's source, so their ranges slice
that source directly:

```js
const nested = word.parts.find((part) => part.type === "CommandExpansion").script;
const command = nested.commands[0].command;

source.slice(command.pos, command.end); // exact nested command source
```

A legacy backtick script whose body contains backslash escapes owns its decoded
string as a non-enumerable `source` property. Ordinary scripts nested inside it
index that decoded source. Object spread and `structuredClone` omit `source`
because it is non-enumerable.

Parse errors inside a lazily parsed script surface on that script, not on the
root: check `errors` on every nested `script` while traversing. A consumer that
only reads the root `errors` array cannot tell that a substitution body failed
to parse.

### Print

Basic opinionated printer, does not preserve whitespace or comments (except
shebang):

```ts
import { parse } from "unbash";
import { print } from "unbash/printer";

const ast = parse('if [ -f "$1" ]; then cat "$1"; fi');
const script = print(ast);
```

Result:

```sh
if [ -f "$1" ]; then
  cat "$1"
fi
```

## unbash vs tree-sitter-bash

[tree-sitter-bash][8] is the right choice when you need:

- Incremental parsing
- CST output preserving all tokens and punctuation
- Granular error recovery that wraps errors in `ERROR` nodes and continues
  parsing

unbash provides:

- A typed, executable-syntax AST instead of a grammar CST
- A synchronous, zero-dependency TypeScript package with no native addon, WASM
  runtime, parser initialization, or query layer
- Structured word parts, arithmetic and test-expression trees, recursively
  parsed substitutions, and direct source positions
- Best-effort error recovery that preserves a partial AST and collects errors
- Also see [tree-sitter-bash gaps covered by unbash][9]

## unbash vs sh-syntax

[sh-syntax][10] is a WASM wrapper around the robust [mvdan/sh][11] Go parser. It
is highly recommended if you need:

- Support for multiple shell dialects (Bash, POSIX sh, mksh, Bats, and Zsh)
- Mature, configurable formatting and pretty-printing

unbash provides:

- A zero-dependency, synchronous TypeScript API without WASM loading
- A smaller, JSON-friendly Bash AST with lazy structured word parts, recursively
  parsed substitutions, and direct source positions
- Best-effort partial ASTs for malformed or incomplete editor and user input
- Also see [sh-syntax gaps covered by unbash][12]

## unbash vs bash-parser

[bash-parser][13] (last publish: 2017) and its fork
[@ericcornelissen/bash-parser][14] (community dependency maintenance fork ❤️ now
archived) provide:

- A POSIX-only mode that rejects bash-specific syntax

unbash provides:

- A zero-dependency architecture
- A typed TypeScript API (ESM-only)
- Best-effort error recovery that preserves a partial AST and collects errors
- Structured AST nodes for parameter expansions, arithmetic expressions, and `[[
]]` test expressions; `bash-parser` treats `[[ ]]` as ordinary commands and
  `(( ))` as nested subshells
- Herestrings, C-style `for`, `select`, process substitution, `coproc`, array
  assignments, extglob, `;&`/`;;&` case fallthrough, Bash 5.3 command
  substitutions, and `{variable}` file-descriptor redirects

## Benchmarks

Parse throughput in MB/s, calculated from the median of 22 per-run p75 iteration times; higher is better. Parentheses show unbash's relative speed. Measured on Apple M1 Pro/32GB using Node.js 24.19.0.

| Parser                       | short (1.1KiB) | advanced (0.9KiB) | medium (150KiB) | large (970KiB) |
| ---------------------------- | -------------: | ----------------: | --------------: | -------------: |
| **unbash**                   |       **76.5** |          **70.5** |        **95.3** |      **112.4** |
| tree-sitter-bash (native)    |     4.60 (17x) |        6.55 (11x) |      15.07 (6x) |     11.92 (9x) |
| tree-sitter-bash (WASM)      |     4.59 (17x) |        5.64 (12x) |      8.59 (11x) |     7.64 (15x) |
| sh-syntax                    |   0.03 (2981x) |      0.03 (2015x) |      7.49 (13x) |     13.63 (8x) |
| bash-parser                  |    0.27 (287x) |               n/a |             n/a |            n/a |
| @ericcornelissen/bash-parser |    0.25 (301x) |               n/a |             n/a |            n/a |

Run the benchmarks using Node.js v22+:

```sh
pnpm install
node bench/all.ts
```

## Size

The parser bundle is 80KB minified and 19KB gzipped.

## Playgrounds

- [unbash.statichost.page][15]
- [ast-explorer.dev][16]

## License

ISC

[1]: https://www.npmx.dev/package/unbash
[2]: https://img.shields.io/npm/v/unbash?color=f56e0f
[3]: https://img.shields.io/npm/dm/unbash?color=f56e0f
[4]: https://nodejs.org/api/util.html#utilparseargsconfig
[5]: https://yargs.js.org/
[6]: https://www.npmjs.com/package/citty
[7]: https://unbash.statichost.page/#input=if%20%5B%20-f%20%22%241%22%20%5D%3B%20then%20cat%20%22%241%22%3B%20fi
[8]: https://github.com/tree-sitter/tree-sitter-bash
[9]: https://github.com/webpro-nl/unbash/issues/6
[10]: https://github.com/un-ts/sh-syntax
[11]: https://github.com/mvdan/sh
[12]: https://github.com/webpro-nl/unbash/issues/7
[13]: https://github.com/vorpaljs/bash-parser
[14]: https://github.com/ericcornelissen/bash-parser
[15]: https://unbash.statichost.page
[16]: https://ast-explorer.dev/#eNoVjDsKwzAQRK8yDK5CyAGS2nVAId02jixZAbFr/Kls393rbh7zeBsrn5xLqpV3jr5X/XVzcYgOKRaD8LoNzffTBqFotgkZf8XtUW14oTdRIHaLq00WYscwpRFtCO8g2psm75n3toPHCdz+Ivg=
