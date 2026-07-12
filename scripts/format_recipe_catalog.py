#!/usr/bin/env python3
"""Transform README Prompt Library recipes to compact catalog layout."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import check_readme_recipes as checker

FILL_CANONICAL_POINTER = (
    "Match the **placeholder table** above; paste `none` for optional zones you omit."
)
METADATA_SUMMARY = (
    "<summary><strong>After copy</strong> — fill · output · upgrade · safety · sources</summary>"
)
POST_COPY_FIELDS = (
    "Fill these in:",
    "Expected output:",
    "Upgrade when:",
    "Safety/eval checks:",
    "Sources:",
)
CONTROL_NOTE_PREFIX = "Control/evidence note:"
NAV_MARKER = '<p align="right">'
COPY_PROMPT_MARKER = "<!-- Copy prompt: -->"


def collapse_field_content(lines: list[str]) -> str:
    """Join non-empty lines into one dense paragraph."""
    parts: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("- "):
            stripped = stripped[2:].strip()
        parts.append(stripped)
    return " ".join(parts)


def extract_field_block(recipe_lines: list[str], field: str, stop_fields: set[str]) -> tuple[str, int, int]:
    """Return (content, start_index, end_index) for a recipe field block."""
    try:
        start = recipe_lines.index(field)
    except ValueError:
        return "", -1, -1
    end = len(recipe_lines)
    for index in range(start + 1, len(recipe_lines)):
        line = recipe_lines[index]
        if line in stop_fields or line.startswith(CONTROL_NOTE_PREFIX):
            end = index
            break
        if line.startswith(NAV_MARKER) or line == "<details>" or line == "---":
            end = index
            break
    content = collapse_field_content(recipe_lines[start + 1 : end])
    return content, start, end


def extract_control_note(recipe_lines: list[str]) -> tuple[str, int, int]:
    for index, line in enumerate(recipe_lines):
        if line.startswith(CONTROL_NOTE_PREFIX):
            end = index + 1
            while end < len(recipe_lines):
                candidate = recipe_lines[end]
                if candidate in POST_COPY_FIELDS or candidate.startswith(NAV_MARKER):
                    break
                if candidate == "<details>" or candidate == "---":
                    break
                end += 1
            content = collapse_field_content([recipe_lines[index], *recipe_lines[index + 1 : end]])
            return content, index, end
    return "", -1, -1


def remove_indices(lines: list[str], ranges: list[tuple[int, int]]) -> list[str]:
    if not ranges:
        return lines
    keep = [True] * len(lines)
    for start, end in sorted(ranges):
        for index in range(start, end):
            if 0 <= index < len(keep):
                keep[index] = False
    return [line for index, line in enumerate(lines) if keep[index]]


def transform_recipe_body(lines: list[str]) -> list[str]:
    """Transform one recipe block (heading through nav, excluding trailing ---)."""
    result: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if line == "Paste zones:":
            index += 1
            while index < len(lines) and not lines[index].strip():
                index += 1
            continue
        result.append(line)
        index += 1

    if COPY_PROMPT_MARKER in result:
        copy_index = result.index(COPY_PROMPT_MARKER)
        if copy_index > 0 and result[copy_index - 1].strip() != "---":
            result.insert(copy_index, "")
            result.insert(copy_index + 1, "---")
            copy_index += 2

    stop_fields = set(POST_COPY_FIELDS)
    field_contents: dict[str, str] = {}
    removal_ranges: list[tuple[int, int]] = []
    for field in POST_COPY_FIELDS:
        content, start, end = extract_field_block(result, field, stop_fields)
        if start >= 0:
            field_contents[field] = content
            removal_ranges.append((start, end))

    control_content, control_start, control_end = extract_control_note(result)
    if control_start >= 0:
        removal_ranges.append((control_start, control_end))

    if "Fill these in:" not in field_contents:
        return result

    metadata_lines = [
        "<details>",
        METADATA_SUMMARY,
        "",
        "Fill these in:",
        "",
        FILL_CANONICAL_POINTER,
        "",
        "Expected output:",
        "",
        field_contents.get("Expected output:", ""),
        "",
        "Upgrade when:",
        "",
        field_contents.get("Upgrade when:", ""),
        "",
    ]
    if control_content:
        metadata_lines.extend(
            [
                control_content,
                "",
            ]
        )
    metadata_lines.extend(
        [
            "Safety/eval checks:",
            "",
            field_contents.get("Safety/eval checks:", ""),
            "",
            "Sources:",
            "",
            field_contents.get("Sources:", ""),
            "",
            "</details>",
            "",
        ]
    )

    nav_index = next((i for i, row in enumerate(result) if row.startswith(NAV_MARKER)), len(result))
    trimmed = remove_indices(result, removal_ranges)
    nav_index = next((i for i, row in enumerate(trimmed) if row.startswith(NAV_MARKER)), len(trimmed))
    return [*trimmed[:nav_index], *metadata_lines, *trimmed[nav_index:]]


def add_recipe_separators(lines: list[str], recipe_starts: list[int], recipe_ends: list[int]) -> list[str]:
    """Insert --- between recipes (after nav, before next heading)."""
    insertions: list[int] = []
    for end in recipe_ends[:-1]:
        if end <= 0 or end > len(lines):
            continue
        prev_non_empty = end - 1
        while prev_non_empty >= 0 and not lines[prev_non_empty].strip():
            prev_non_empty -= 1
        if prev_non_empty >= 0 and lines[prev_non_empty].strip() == "---":
            continue
        insertions.append(end)
    offset = 0
    for position in insertions:
        pos = position + offset
        lines[pos:pos] = ["", "---", ""]
        offset += 3
    return lines


def update_recipe_format_section(lines: list[str]) -> list[str]:
    text = "\n".join(lines)
    text = text.replace(
        "> **Before you copy:** use the **Paste zones** table; paste `none` for optional zones you omit.",
        "> **Before you copy:** use the placeholder table; paste `none` for optional zones you omit.",
    )
    text = text.replace(
        "| Before you copy TIP | Points to paste zones; use `none` for unused optional zones. |",
        "| Before you copy TIP | Points to placeholder table; use `none` for unused optional zones. |",
    )
    text = text.replace(
        "| Paste zones | Canonical placeholders, required/optional, examples, notes. |",
        "| Placeholder table | Canonical placeholders, required/optional, examples, notes. |",
    )
    text = text.replace(
        "| Fill these in | One-line pointer to **Paste zones**. |",
        "| Fill these in | One-line pointer to placeholder table (in **After copy** details). |",
    )
    return text.splitlines()


def transform_readme(markdown: str) -> str:
    lines = markdown.splitlines()
    section = checker.find_section(lines, "## Prompt Library")
    if section is None:
        raise SystemExit("Missing ## Prompt Library section")

    start, end = section
    errors: list[checker.Diagnostic] = []
    recipes = checker.parse_recipes(lines, errors)
    if len(recipes) != 48:
        raise SystemExit(f"Expected 48 recipes, found {len(recipes)}")

    recipe_ranges = [(recipe.start, recipe.end) for recipe in recipes]
    transformed_chunks: dict[int, list[str]] = {}
    for recipe in recipes:
        transformed_chunks[recipe.start] = transform_recipe_body(recipe.lines)

    new_library: list[str] = []
    cursor = start
    for recipe_start, recipe_end in recipe_ranges:
        new_library.extend(lines[cursor:recipe_start])
        new_library.extend(transformed_chunks[recipe_start])
        cursor = recipe_end
    new_library.extend(lines[cursor:end])

    # Re-parse transformed library section for separator insertion
    temp_lines = lines[:start] + new_library + lines[end:]
    temp_errors: list[checker.Diagnostic] = []
    updated_recipes = checker.parse_recipes(temp_lines, temp_errors)
    recipe_ends_rel = [recipe.end - start for recipe in updated_recipes]
    library_with_seps = add_recipe_separators(new_library, [r.start - start for r in updated_recipes], recipe_ends_rel)

    output = lines[:start] + library_with_seps + lines[end:]
    output = update_recipe_format_section(output)
    return "\n".join(output) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--readme", type=Path, default=Path("README.md"))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--check", action="store_true", help="Verify README already transformed")
    args = parser.parse_args()
    readme = args.readme.read_text(encoding="utf-8")
    if args.check:
        if "Paste zones:" in readme:
            raise SystemExit("README still contains Paste zones: labels")
        if FILL_CANONICAL_POINTER not in readme:
            raise SystemExit("README missing canonical fill pointer")
        return
    # One-shot migration tool: refuse to re-apply on already-compact catalog.
    if "### After copy" in readme or "<summary>After copy</summary>" in readme:
        if "Paste zones:" not in readme:
            raise SystemExit(
                "README already uses compact After-copy details; format_recipe_catalog is a one-shot migrator. "
                "Refuse to re-apply. Use --check to verify, or restore a pre-transform backup."
            )
    transformed = transform_readme(readme)
    if args.dry_run:
        print(transformed[:4000])
        return
    args.readme.write_text(transformed, encoding="utf-8")
    print(f"Transformed {args.readme}")


if __name__ == "__main__":
    main()
