#!/usr/bin/env bash
# Portable ShieldCN badge URL smoke check (no bash mapfile).
set -euo pipefail

tmp_urls="$(mktemp "${TMPDIR:-/tmp}/prompts-badge-urls.XXXXXX")"
trap 'rm -f "$tmp_urls"' EXIT

# Keep export failure in the main shell. Bash does not propagate a failing
# process-substitution producer through `set -e`.
python3 scripts/update_readme_badges.py --list-urls >"$tmp_urls"

count=0
while IFS= read -r badge; do
  [ -n "$badge" ] || continue
  count=$((count + 1))
  echo "Checking $badge"
  if ! content_type="$(
    curl --fail --silent --show-error --location --head --retry 3 --retry-delay 2 \
      --output /dev/null --write-out '%{content_type}' "$badge"
  )"; then
    echo "Failed to fetch $badge" >&2
    exit 1
  fi
  if ! printf '%s\n' "$content_type" | grep -Eiq '^[[:space:]]*image/svg\+xml([[:space:]]*;.*)?[[:space:]]*$'; then
    echo "Expected image/svg+xml for $badge"
    printf 'Final Content-Type: %s\n' "$content_type"
    exit 1
  fi
done <"$tmp_urls"

if [ "$count" -eq 0 ]; then
  echo "Expected generated ShieldCN badge URLs, found none." >&2
  exit 1
fi
