# Antigravity Code Quality & Anti-Slop Guidelines (aislop)

This workspace enforces strict code quality and maintainability standards powered by **aislop**. AI assistants must write clean, production-grade, human-readable code. AI-generated anti-patterns ("slop"), conversational code commentary, and hidden error suppressions are strictly prohibited.

---

## 1. Absolute Prohibitions (Zero Tolerance)

### A. Narrative & Conversational Comments
- **DO NOT** write narrative step-by-step commentary explaining code as if narrating a tutorial:
  - ❌ `// Now we initialize the variable`
  - ❌ `// First, fetch data from the API`
  - ❌ `// Loop through each item and check if valid`
  - ❌ `// Step 2: Handle the response`
- **DO NOT** include meta-commentary about instructions, queries, or reasoning:
  - ❌ `// Added as requested by user`
  - ❌ `// Modified to fix the linting error above`
- **DO NOT** write trivial or tautological comments:
  - ❌ `user.name = "John"; // set user name to John`
- **DO** write comments only when documenting non-obvious business logic, domain invariants, architectural constraints, or public API docstrings (`JSDoc`/`Docstring`/`godoc`).

### B. Swallowed Errors & Silent Failure Patterns
- **DO NOT** swallow errors in empty catch blocks or catch blocks that only log/ignore:
  - ❌ `try { ... } catch (e) {}`
  - ❌ `try: ... except Exception: pass`
  - ❌ `_, _ = doSomething()` (in Go, dropping critical error returns)
- **DO NOT** use hidden fallback patterns that silently mask critical failures:
  - ❌ `try { return fetchConfig(); } catch { return {}; }` (when config failure breaks assumptions downstream)
- **DO** handle errors explicitly: fail fast, log with actionable structured context, propagate up the call stack, or transform into well-typed domain errors.

### C. Fake Type Safety & Suppression Directives
- **DO NOT** bypass type safety using escape hatches:
  - ❌ Avoid `as any`, `as unknown as T`, or double-assertions in TypeScript.
  - ❌ Avoid blanket suppression directives (`@ts-ignore`, `eslint-disable`, `// nolint`, `#[allow(...)]`) unless explicitly documented with a ticket/rationale.
- **DO NOT** hallucinate imports: only import libraries declared in `package.json`, `pyproject.toml`, `go.mod`, or `Cargo.toml`.

### D. Dead Code, Leftovers & Defensive Bloat
- **DO NOT** leave dead imports, unused variables, orphan CSS selectors, or debugging logs (`console.log`, `print()`, `fmt.Println`) in production code.
- **DO NOT** introduce excessive defensive programming (gratuitous null checks or chained `?.` on types that are non-nullable by design).
- **DO NOT** leave placeholder stubs like `TODO: implement later` or empty functions.

---

## 2. Quality Gates & Remediation Workflow

1. **Scan Before Completing:**
   - Before reporting a task or pull request as complete, run an `aislop` scan via the `aislop_scan` MCP tool (or CLI `aislop scan .`).
   - Treat scan findings as **blocking quality gates**, not advisory notes. The minimum acceptable score is determined by `.aislop/config.yml` (default threshold: 85+ / zero blocking errors).

2. **Remediation Priority:**
   - **Step 1 (Mechanical):** Run `aislop_fix` (or CLI `aislop fix`) to automatically eliminate formatting issues, unused imports, and narrative comments.
   - **Step 2 (Manual):** Inspect remaining findings. Use `aislop_why` if the diagnostic rule or fix guidance requires clarification.
   - **Step 3 (Verify):** Re-run `aislop_scan` to verify score improvement and confirm zero regression against `aislop_baseline`.

3. **No Rule Weakening:**
   - Never disable engines, weaken thresholds in `.aislop/config.yml`, or delete architecture rules in `.aislop/rules.yml` just to make a scan pass. Fix the code, not the gauge.
