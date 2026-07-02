#!/usr/bin/env python3
"""Audit paste-zone Example value cell lengths across README recipes."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_readme_recipes as checker  # noqa: E402

WARN_LENGTH = 72
ERROR_LENGTH = checker.RECIPE_PASTE_ZONE_VALUE_LENGTH


def audit_readme(readme: Path) -> dict[str, object]:
    lines = readme.read_text(encoding="utf-8").splitlines()
    errors: list[checker.Diagnostic] = []
    recipes = checker.parse_recipes(lines, errors)
    rows: list[dict[str, object]] = []
    over_warn = 0
    over_error = 0
    for recipe in recipes:
        positions = checker.field_positions(recipe, [])
        region = checker.recipe_body_before_copy_prompt(recipe, positions)
        visible_region = checker.text_outside_details(region)
        for table_row in checker.paste_zone_table_rows(visible_region, checker.PASTE_ZONE_TABLE_HEADER):
            cells = [cell.strip() for cell in table_row.strip("|").split("|")]
            if len(cells) < 4:
                continue
            placeholder = cells[0]
            example_value = checker.strip_markdown(cells[2])
            if example_value.lower() in checker.PASTE_PREVIEW_POINTER_VALUES:
                continue
            length = len(example_value)
            status = "ok"
            if length > ERROR_LENGTH:
                status = "error"
                over_error += 1
            elif length > WARN_LENGTH:
                status = "warn"
                over_warn += 1
            rows.append(
                {
                    "recipe": recipe.name,
                    "placeholder": placeholder,
                    "length": length,
                    "status": status,
                    "example_value": example_value,
                }
            )
    return {
        "readme": str(readme),
        "ok": over_error == 0,
        "counts": {
            "recipes": len(recipes),
            "cells": len(rows),
            "warn": over_warn,
            "error": over_error,
        },
        "rows": rows,
    }


def print_report(result: dict[str, object]) -> None:
    counts = result["counts"]
    print(
        f"Paste-zone cell audit: {counts['cells']} cells across {counts['recipes']} recipes "
        f"({counts['warn']} warn >{WARN_LENGTH}, {counts['error']} error >{ERROR_LENGTH})."
    )
    for row in result["rows"]:
        if row["status"] == "ok":
            continue
        print(
            f"{row['status']}: {row['recipe']} {row['placeholder']} "
            f"({row['length']} chars): {row['example_value']!r}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--readme", default="README.md", help="README path")
    parser.add_argument("--check", action="store_true", help="exit nonzero when any cell exceeds hard limit")
    parser.add_argument("--strict-warn", action="store_true", help="exit nonzero when any cell exceeds soft limit (72)")
    parser.add_argument("--json", action="store_true", help="print JSON report")
    args = parser.parse_args()
    result = audit_readme(Path(args.readme))
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print_report(result)
    if args.check and not result["ok"]:
        return 1
    counts = result["counts"]
    if args.strict_warn and counts["warn"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
