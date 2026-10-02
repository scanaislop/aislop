# Telemetry

`aislop` collects anonymous usage analytics to help prioritize improvements. **No code, file paths, project names, repo names, branch names, raw diagnostics, or secrets are ever collected.**

## What we collect

Seven events:

| Event | When |
|---|---|
| `cli_installed` | First-ever run on a machine (when `~/.aislop/install_id` is created) |
| `cli_command_started` | Beginning of any command (`scan`, `fix`, `ci`, `init`, `doctor`, `rules`, `badge`, `agent`, `agent plan/providers/connect/use/monitor/sessions/show/apply/watch/stop`, `hook install/uninstall/status/baseline`) |
| `cli_command_completed` | End of any command — success or failure (carries `exit_code`, `duration_ms`, score, finding counts, engine stats) |
| `cli_command_failed` | A crash that escapes a command: an uncaught exception, an unhandled rejection, or a failed startup |
| `mcp_server_started` | After the `aislop-mcp` stdio transport connects |
| `mcp_tool_called` | Each `aislop_scan` / `aislop_fix` / `aislop_why` / `aislop_baseline` invocation |
| `hook_scan_completed` | After a Claude / Cursor / Gemini / pi agent hook finishes a scoped scan |

Each event carries:

- `aislop_version`, `node_version`, `os`, `arch`
- `schema_version` (currently `"v2"`)
- `anonymous_install_id` — random UUID stored in `~/.aislop/install_id` (re-rolls if you delete the file)
- `package_manager` — install channel: `npm` / `pnpm` / `yarn` / `bun` / `npx` / `homebrew` / `pip` / `pipx` / `direct` / `unknown` (Python and other shims may set `AISLOP_INSTALL_CHANNEL` before invoking the Node CLI)
- `is_ci` — true only if `CI=true` AND you've explicitly opted in via config

Command events additionally carry: `command`, `language_summary`, per-language flags (`lang_typescript`, `lang_javascript`, `lang_python`, `lang_java`), `file_count_bucket` (`0-10` / `10-50` / `50-100` / `100-500` / `500-1000` / `1000+`), `score_bucket`, score, finding counts, and per-engine timings.

When a command fails, its `cli_command_completed` event adds `error_kind` (`config_invalid` / `engine_crash` / `provider_unavailable` / `timeout` / `unknown`), `error_name` (the error class, sent only when it is a plain identifier such as `TypeError`), and `error_code` (a short machine code such as `ENOENT`). Scans whose engines crash add `engines_failed`, a list of engine names.

`cli_command_failed` is a separate, smaller event with its own shape: `failed_stage` (`uncaught_exception` / `unhandled_rejection` / `main`), `error_name`, and `error_code` when one is available. It has no `error_kind`.

Error messages, stack traces, and file paths are never sent.

Agent command events add only aggregate options and outcomes: provider (`auto` / `codex` / `claude` / `opencode` / `pi` / `none` / `unknown`), provider source, target score, max turns, finding limit, worktree mode, dry-run/background/apply/publish flags, and foreground session outcomes such as before/after score, score delta, changed-file count, provider pass count, tool-call count, total tokens, cost, applied/published state, and target-met status. Session ids, paths, branch names, prompts, raw findings, provider output, and transcript contents stay local.

Properties are filtered through an allowlist before being sent — anything not on the list is dropped, even if a future caller passes it.

## Anonymous identity

Telemetry uses a random UUID stored at `~/.aislop/install_id` (or `$XDG_STATE_HOME/aislop/install_id` on Linux). Deleting the file re-rolls your identity. The file is created with `0600` permissions and is never created if telemetry is disabled.

## Opt out

Precedence (highest wins):

1. `AISLOP_NO_TELEMETRY=1` or `DO_NOT_TRACK=1` environment variables → off, always.
2. `.aislop/config.yml` → `telemetry.enabled: false` → off.
3. `.aislop/config.yml` → `telemetry.enabled: true` → on (this also overrides the CI default).
4. `CI=true` with no explicit config → off.
5. Default → on.

```bash
# Environment variable (any of these)
AISLOP_NO_TELEMETRY=1 aislop scan
DO_NOT_TRACK=1 aislop scan
```

```yaml
# .aislop/config.yml
telemetry:
  enabled: false
```

## Inspecting what gets sent

Set `AISLOP_TELEMETRY_DEBUG=1` to print every outgoing event to stderr as JSON. Combine with `AISLOP_TELEMETRY_DRY_RUN=1` to print without sending — useful for "what would this command emit?"

```bash
AISLOP_TELEMETRY_DEBUG=1 AISLOP_TELEMETRY_DRY_RUN=1 aislop scan
```
