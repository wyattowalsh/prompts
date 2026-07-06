#!/usr/bin/env python3
"""Validate sources.yaml without external dependencies.

The manifest intentionally uses a small YAML subset: a top-level list of records
where every record is introduced by ``- id: ...`` and subsequent fields are
simple ``key: value`` scalars. This keeps CI deterministic and avoids adding a
YAML dependency for one repository-local freshness contract.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REFRESH = ROOT / "docs" / "audit" / "source-refresh.md"
DEFAULT_MANIFEST = ROOT / "sources.yaml"

REQUIRED_FIELDS = {
    "id",
    "owner",
    "url",
    "source_type",
    "status",
    "last_checked",
    "claim_scope",
    "replacement_url",
    "notes",
}
SOURCE_TYPES = {
    "official doc",
    "primary paper",
    "survey",
    "standard",
    "practitioner",
    "community",
}
STATUSES = {"checked", "redirected", "blocked", "stale", "replaced", "not checked"}
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def parse_manifest(path: Path) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    current: dict[str, str] | None = None

    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if line.startswith("- "):
            if current is not None:
                entries.append(current)
            current = {}
            key, value = parse_field(line[2:], lineno)
            current[key] = value
            continue
        if line.startswith("  ") and current is not None:
            key, value = parse_field(stripped, lineno)
            current[key] = value
            continue
        raise ValueError(f"line {lineno}: expected '- key: value' or indented 'key: value'")

    if current is not None:
        entries.append(current)
    return entries


def parse_field(text: str, lineno: int) -> tuple[str, str]:
    if ":" not in text:
        raise ValueError(f"line {lineno}: expected 'key: value'")
    key, value = text.split(":", 1)
    key = key.strip()
    value = value.strip()
    if not key or not value:
        raise ValueError(f"line {lineno}: key and value are required")
    return key, value


def validate_entries(entries: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    ids: set[str] = set()
    urls: set[str] = set()

    if not entries:
        return ["manifest has no entries"]

    for index, entry in enumerate(entries, start=1):
        label = entry.get("id", f"entry {index}")
        missing = sorted(REQUIRED_FIELDS - set(entry))
        if missing:
            errors.append(f"{label}: missing required fields: {', '.join(missing)}")
            continue

        entry_id = entry["id"]
        if not ID_RE.match(entry_id):
            errors.append(f"{label}: id must be lowercase kebab-case")
        if entry_id in ids:
            errors.append(f"{label}: duplicate id")
        ids.add(entry_id)

        url = entry["url"]
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc:
            errors.append(f"{label}: url must be absolute https URL")
        if url in urls:
            errors.append(f"{label}: duplicate url")
        urls.add(url)

        if entry["source_type"] not in SOURCE_TYPES:
            errors.append(
                f"{label}: source_type must be one of {', '.join(sorted(SOURCE_TYPES))}"
            )
        if entry["status"] not in STATUSES:
            errors.append(f"{label}: status must be one of {', '.join(sorted(STATUSES))}")

        try:
            dt.date.fromisoformat(entry["last_checked"])
        except ValueError:
            errors.append(f"{label}: last_checked must be an ISO date")

        replacement = entry["replacement_url"]
        if replacement != "none":
            replacement_url = urlparse(replacement)
            if replacement_url.scheme != "https" or not replacement_url.netloc:
                errors.append(f"{label}: replacement_url must be 'none' or absolute https URL")

    return errors


def manifest_by_id(entries: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {entry["id"]: entry for entry in entries if "id" in entry}


def validate_source_refresh(source_refresh: Path, entries: list[dict[str, str]]) -> list[str]:
    """Validate manifest IDs and URLs embedded in docs/audit/source-refresh.md."""

    errors: list[str] = []
    if not source_refresh.exists():
        return [f"{source_refresh}: source refresh file does not exist"]

    entries_by_id = manifest_by_id(entries)
    text = source_refresh.read_text(encoding="utf-8")
    found_manifest_cell = False
    for lineno, line in enumerate(text.splitlines(), start=1):
        if not line.startswith("|") or "`" not in line:
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 5 or cells[4] in {"Manifest id", "---"}:
            continue
        manifest_id = cells[4].strip("`")
        found_manifest_cell = True
        if not manifest_id:
            errors.append(f"{source_refresh}:{lineno}: missing manifest id")
            continue
        if not ID_RE.match(manifest_id):
            errors.append(
                f"{source_refresh}:{lineno}: invalid manifest id {manifest_id}; "
                "expected lowercase kebab-case"
            )
            continue
        if manifest_id not in entries_by_id:
            errors.append(f"{source_refresh}:{lineno}: unknown manifest id {manifest_id}")
            continue
        url_match = re.search(r"\((https://[^)]+)\)", cells[1])
        if not url_match:
            errors.append(f"{source_refresh}:{lineno}: missing source URL for {manifest_id}")
            continue
        source_url = url_match.group(1)
        manifest_url = entries_by_id[manifest_id]["url"]
        if source_url != manifest_url:
            errors.append(
                f"{source_refresh}:{lineno}: URL mismatch for {manifest_id}: "
                f"source-refresh has {source_url}, manifest has {manifest_url}"
            )

    if not found_manifest_cell:
        errors.append(f"{source_refresh}: no source-refresh manifest IDs found")
    return errors


def run(
    path: Path = DEFAULT_MANIFEST,
    source_refresh: Path | None = SOURCE_REFRESH,
) -> dict[str, object]:
    entries = parse_manifest(path)
    errors = validate_entries(entries)
    if source_refresh is not None:
        errors.extend(validate_source_refresh(source_refresh, entries))
    return {"ok": not errors, "entries": entries, "errors": errors}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--source-refresh", type=Path, default=SOURCE_REFRESH)
    parser.add_argument(
        "--no-source-refresh",
        action="store_true",
        help="skip docs/audit/source-refresh.md cross-reference validation",
    )
    parser.add_argument("--check", action="store_true", help="validate and print a concise result")
    args = parser.parse_args(argv)

    source_refresh = None if args.no_source_refresh else args.source_refresh
    result = run(args.manifest, source_refresh)
    if result["ok"]:
        if args.check:
            print(f"Source manifest checks passed ({len(result['entries'])} entries).")
        return 0
    for error in result["errors"]:
        print(f"error: {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
