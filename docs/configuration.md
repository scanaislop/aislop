# Configuration

Run `aislop init` to generate `.aislop/config.yml` with default values.

## Default config

```yaml
version: 1

engines:
  format: true
  lint: true
  code-quality: true
  ai-slop: true
  architecture: false    # opt-in, needs rules.yml
  security: true

quality:
  maxFunctionLoc: 80
  maxFileLoc: 400
  maxNesting: 5
  maxParams: 6

security:
  audit: true
  auditTimeout: 25000

scoring:
  weights:
    format: 0.3
    lint: 0.6
    code-quality: 0.8
    ai-slop: 1.0
    architecture: 1.0
    security: 1.5
  thresholds:
    good: 75
    ok: 50
  smoothing: 20
  maxPerRule: 40

ci:
  failBelow: 70          # fail CI below this score
  format: json

telemetry:
  enabled: true          # set to false to opt out
```

## Ordered per-file overrides

Use one `.aislop/config.yml` and one scan for different file policies:

```yaml
version: 1
quality:
  maxFileLoc: 400
rules:
  complexity/file-too-large: warning
overrides:
  - files: ["**/*.controller.ts"]
    quality:
      maxFileLoc: 700
  - files: ["**/*.generated.ts", "src/legacy/**"]
    rules:
      complexity/file-too-large: off
      ai-slop/trivial-comment: off
  - files: ["src/legacy/critical.service.ts"]
    rules:
      complexity/file-too-large: error
```

Overrides use ordered glob matching, similar to Biome's overrides. Patterns are
relative to the scanned project directory, not the `.aislop` directory. Write
patterns with `/` on every OS; Windows file paths are normalized before matching.
`**` crosses directories, and dot directories are included. Each entry requires a
non-empty `files` list. Multiple positive patterns select a union; negative patterns
such as `!**/*.service.ts` exclude matches from that entry.

Each matching entry merges only the fields it supplies. Later entries win for the
same field or rule, including re-enabling a rule previously set to `off`. Unmatched
files retain the top-level policy. Supported fields are `quality.maxFileLoc`,
`maxFunctionLoc`, `maxNesting`, `maxParams`, and `rules` with `error`, `warning`, or
`off`. Quality values must be positive. Other settings remain project-wide.

Quality overrides feed the existing complexity checks: language multipliers,
exemptions, and the existing line-count tolerance still apply. Rule severity is
resolved before scoring and reporting; `off` suppresses that rule's diagnostic,
not the entire file or an external formatter. Overrides do not grant an exclusion
from mutating fix tools; use `exclude` when generated files must never be rewritten.
The policy is also used by hook/MCP scans and post-fix verification. No LLM or
network resolver is involved in matching. Without overrides, behavior is unchanged.

When using `extends`, an explicitly supplied child `overrides` array replaces the
parent's array, like other arrays; if omitted, the parent's array is inherited.

## Engines

Each engine can be enabled or disabled individually:

```yaml
engines:
  format: true        # formatting checks
  lint: true          # linting checks
  code-quality: true  # complexity, dead code, unused deps
  ai-slop: true       # AI pattern detection
  architecture: false  # custom import/path rules (requires rules.yml)
  security: true       # secrets, risky constructs, dependency audits
```

## Quality thresholds

Control what triggers code quality warnings:

| Setting | Default | Description |
|---|---|---|
| `maxFunctionLoc` | 80 | Max lines per function |
| `maxFileLoc` | 400 | Max lines per file |
| `maxNesting` | 5 | Max control-flow nesting depth |
| `maxParams` | 6 | Max function parameters |

## Runtime-provided imports

`ai-slop/hallucinated-import` reports imports that no manifest declares. Python dependencies come from `pyproject.toml`, `Pipfile`, `requirements*.txt` files (including `-r` includes and a `requirements/` directory), and PEP 723 inline script metadata.

Some modules come from the runtime instead of a manifest, for example `homeassistant` in a Home Assistant integration, Sage's bundled packages, or `vscode` in a VS Code extension. List them under `imports.provided` so they are not reported:

```yaml
imports:
  provided:
    - homeassistant
    - fpylll
```

Each entry covers the module and its submodules (`homeassistant.core`, `vscode/...`).

## Engine weights

Control how much each engine contributes to the final score:

```yaml
scoring:
  weights:
    format: 0.3       # formatting issues have lighter impact
    lint: 0.6
    code-quality: 0.8
    ai-slop: 1.0      # AI-slop signals stay visible without dominating warnings
    architecture: 1.0
    security: 1.5
  smoothing: 20        # increase to reduce penalty spikes on larger repos
  maxPerRule: 40       # cap one rule family so repeated noise cannot dominate
```

## Extending a shared config

`extends:` lets a project inherit a parent config and override only the keys it cares about. Useful for org-wide baselines.

```yaml
# packages/payments/.aislop/config.yml
extends: ../../.aislop/base.yml

ci:
  failBelow: 80         # override one key, inherit everything else from the parent
```

Multiple parents are supported via an array; later entries win on conflict:

```yaml
extends:
  - ../../.aislop/base.yml
  - ./local-overrides.yml
```

**Resolution rules**

- Paths are relative to the config file declaring `extends:`. Absolute paths are rejected, and resolved targets must stay inside the project root to avoid reading local files outside the repository. Package or URL forms are not yet supported and will fail with a clear error. Extends targets must be regular files no larger than 1 MiB.
- Nested objects (`engines`, `scoring.weights`, `quality`) are deep-merged key-by-key. The child's keys win on conflict.
- Arrays (e.g. `exclude:`) are replaced wholesale, not concatenated. Append in the child if you want to extend rather than overwrite.
- Cycles and chains deeper than 5 levels are rejected at load time, not silently ignored.

## Architecture rules

Create `.aislop/rules.yml` to define custom import and path rules. Enable the architecture engine in your config:

```yaml
engines:
  architecture: true
```

See [examples/architecture-rules.yml](../examples/architecture-rules.yml) for a sample rules file.

## Example configs

See the [examples/](../examples/) directory for pre-built configs:

- [`typescript-strict.yml`](../examples/typescript-strict.yml): tight thresholds for zero-slop teams
- [`monorepo-relaxed.yml`](../examples/monorepo-relaxed.yml): loose thresholds for incremental adoption
- [`python-go.yml`](../examples/python-go.yml): backend-focused with higher security weight
