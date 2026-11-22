#!/usr/bin/env bash
# Requires VHS (with ttyd and ffmpeg), gifsicle, Ruff, and a built CLI.
set -eu
assets=$(cd "$(dirname "$0")" && pwd)
cli="$assets/../dist/cli.js"
test -x "$cli" || { echo 'Run pnpm build before rendering the demo.' >&2; exit 1; }
for tool in vhs ttyd ffmpeg gifsicle ruff; do
  command -v "$tool" >/dev/null || { echo "Missing $tool" >&2; exit 1; }
done

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir "$work/bin" "$work/cart"
ln -s "$cli" "$work/bin/aislop"
cat > "$work/cart/cart.py" <<'PY'
import math
from collections import Counter
from collections import Counter


def receipt(items):
    quantities = Counter(items)
    return f"Receipt", quantities
PY
cat > "$work/prompt.sh" <<'PROMPT'
export PS1='cart \[\e[1;96m\]\$\[\e[0m\] '
export PATH="$PWD/../bin:$PATH"
export AISLOP_NO_TELEMETRY=1 AISLOP_NO_HISTORY=1 FORCE_COLOR=1
unset NO_COLOR
PROMPT

cd "$work/cart"
BASH_SILENCE_DEPRECATION_WARNING=1 vhs "$assets/scan.tape"
gifsicle -O3 raw.gif -o "$work/scan.gif"
cp "$work/scan.gif" "$assets/scan.gif"
