#!/usr/bin/env bash
# Portable ShieldCN badge URL smoke check (no bash mapfile).
set -euo pipefail

tmp_headers="$(mktemp "${TMPDIR:-/tmp}/prompts-badge.XXXXXX")"
trap 'rm -f "$tmp_headers"' EXIT

count=0
while IFS= read -r badge; do
  [ -n "$badge" ] || continue
  count=$((count + 1))
  echo "Checking $badge"
  curl --fail --silent --show-error --location --head --retry 3 --retry-delay 2 "$badge" >"$tmp_headers"
  if ! grep -iq 'content-type: .*image/svg+xml' "$tmp_headers"; then
    echo "Expected image/svg+xml for $badge"
    cat "$tmp_headers"
    exit 1
  fi
done < <(python3 scripts/update_readme_badges.py --list-urls)

if [ "$count" -eq 0 ]; then
  echo "No ShieldCN badge URLs found."
fi
