# Scala coverage and beta readiness

Scala remains beta because source checks use lexical analysis and validation has not yet covered a representative set of real Scala projects. The beta label applies to coverage and accuracy across language constructs, dialects, and build layouts.

## Current coverage

| Area | Supported behavior | Limits |
|---|---|---|
| Discovery | `.scala`, `.sc`, sbt and Mill build signals | Build files identify the language; Aislop does not evaluate builds |
| Formatting | scalafmt with a root `.scalafmt.conf`, native executable or caller-managed JVM classpath | The caller provisions scalafmt and chooses the dialect; nested module configurations need broader validation |
| Imports | Repeated imports in contiguous blocks; conservative unused checks for explicit Java imports | Scala imports can supply implicits or givens without textual references; semantic unused-import analysis needs compiler information |
| Exceptions | Braced, indented, and mixed catch handlers; nested case boundaries; multiline guards; discarded handlers | Catch expressions delegated to a function and semantic recovery/rethrow analysis are outside the lexical checks |
| Other source checks | Debug output, comment patterns, file-size checks | Scala function length, nesting, and parameter metrics are not implemented |
| Security | Secrets, lexical SQL/shell/deserialization patterns, optional JVM analysis | Lexical rules do not track data flow or resolve library-specific query APIs |
| Dependencies | Resolved JAR audits and report imports through optional OWASP Dependency-Check | Resolve the complete runtime graph first; Aislop does not infer it from sbt or Mill version declarations |
| Architecture | Configured file/pattern rules | Scala import-boundary extraction is not implemented |

See [JVM analysis](jvm-analysis.md) for tool installation, execution consent, dependency caches, and existing report imports. Scala has no standalone compiler or semantic lint engine in Aislop; build execution remains caller-controlled.

## Fixes and validation in this update

- Nested match cases stay inside their catch handler instead of being reported as separate broad catches.
- A discarded catch clause is detected even when a different clause handles its exception. Wrapped Unit bodies and multiline print-only handlers are recognized.
- Balanced guard expressions and multiline case headers preserve the correct clause arrow and source line.
- Triple-quoted strings ending with literal quotes preserve executable code on the same line.
- A scalafmt parse/tool failure marks formatting incomplete. Baseline creation rejects it, and existing baselines cannot accept findings from the failed engine.
- Live integration tests compile the catch and string-boundary fixture with Scala 2.13.16 and Scala 3.3.7. Real scalafmt 3.9.10 roundtrips cover Scala 2, Scala 3 enums/givens/opaque types/extensions, and Scala scripts. Selected-file fixes preserve unselected files.

The JVM integration workflow runs on Linux and Windows. It also checks compiled-code security and vulnerable dependency detection for Scala, as described in the JVM guide.

## Before removing beta

- Validate a pinned corpus of real sbt, Mill, and Scala CLI projects, including multi-module layouts, mixed Scala 2/3 dialects, scripts, exclusions, and formatter configuration overrides.
- Audit false positives and missed findings across Scala 3 layout, multiline/selector imports, extension and given definitions, XML literals, backticked identifiers, and quoted/macro code. These constructs are not represented by a complete syntax tree today.
- Exercise more compiler and formatter versions beyond the pinned integration fixtures, and retain cross-platform regression coverage.
- Keep the documented coverage limits aligned with actual engine behavior. Add compiler-aware or syntax-aware analysis before claiming semantic import, type, or function-metric coverage.

Grammar references: [Scala 3 optional braces](https://docs.scala-lang.org/scala3/reference/other-new-features/indentation.html), [Scala 3 syntax](https://docs.scala-lang.org/scala3/reference/syntax.html), and [Scala 2.13 lexical syntax](https://www.scala-lang.org/files/archive/spec/2.13/01-lexical-syntax.html).
