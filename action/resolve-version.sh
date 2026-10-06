#!/usr/bin/env bash
set -euo pipefail

requested="${1:-}"
action_path="${2:-}"

if [ -n "$requested" ]; then
  echo "$requested"
  exit 0
fi

action_path="${action_path//\\//}"
ref="${action_path%/}"
ref="${ref##*/}"

if [[ "$ref" =~ ^v([0-9]+\.[0-9]+\.[0-9]+([-+][0-9A-Za-z.-]+)?)$ ]]; then
  echo "${BASH_REMATCH[1]}"
  exit 0
fi

if [[ "$ref" =~ ^[0-9a-f]{40}$ ]] && [ -f "$action_path/package.json" ]; then
  version="$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$action_path/package.json" | head -n 1)"
  if [ -n "$version" ]; then
    echo "$version"
    exit 0
  fi
fi

echo latest
