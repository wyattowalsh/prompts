#!/usr/bin/env python3
"""Helper to hoist paste previews above Copy prompt."""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_readme_recipes as checker  # noqa: E402

HOIST_RECIPES = frozenset(
    {
        "Source-Grounded Answer",
        "Code Review",
        "JSON Extractor",
        "Tool-Use Planner",
        "RAG Answer Contract",
        "Regression Judge",
        "Prompt Optimizer",
    }
)

PREVIEW_BLOCK_RE = re.compile(
    r"(?ms)^(?:\*\*)?[Pp]aste preview(?:\*\*)?\s+\(`\{([^}]+)\}`\):\s*\n+>.*?(?=\n(?:\*\*)?[Pp]aste preview|\n(?:expected output shape|<!-- Copy prompt: -->|\Z))",
)


class ApplyError(Exception):
    def __init__(self, errors: list[checker.Diagnostic]) -> None:
        self.errors = errors
        super().__init__(f"{len(errors)} parse/validation errors")


def recipe_details_text(recipe: checker.Recipe) -> str | None:
    marker = "<summary><strong>Filled example</strong></summary>"
    if marker not in recipe.text:
        return None
    return recipe.text.split(marker, 1)[1].split("</details>", 1)[0]


def plan_hoists(readme: Path) -> list[dict[str, object]]:
    lines = readme.read_text(encoding="utf-8").splitlines()
    errors: list[checker.Diagnostic] = []
    recipes = checker.parse_recipes(lines, errors)
    plans: list[dict[str, object]] = []
    for recipe in recipes:
        if recipe.name not in HOIST_RECIPES:
            continue
        positions = checker.field_positions(recipe, [])
        region = checker.recipe_body_before_copy_prompt(recipe, positions)
        visible_region = checker.text_outside_details(region)
        pointers = checker.paste_preview_pointer_names(visible_region)
        visible_previews = checker.visible_paste_preview_names(visible_region)
        details = recipe_details_text(recipe)
        if not details:
            continue
        for match in PREVIEW_BLOCK_RE.finditer(details):
            zone = match.group(1)
            if zone not in pointers:
                continue
            if zone in visible_previews:
                plans.append(
                    {
                        "recipe": recipe.name,
                        "zone": zone,
                        "action": "already_hoisted",
                        "preview": match.group(0).strip(),
                    }
                )
                continue
            plans.append(
                {
                    "recipe": recipe.name,
                    "zone": zone,
                    "action": "hoist",
                    "preview": match.group(0).strip(),
                    "insert_before": "<!-- Copy prompt: -->",
                    "remove_from_details": True,
                    "retarget_example_value": "see preview below",
                }
            )
    return plans


def retarget_paste_zone_example(recipe_lines: list[str], zone: str, new_value: str) -> list[str]:
    result: list[str] = []
    in_table = False
    for line in recipe_lines:
        if line == checker.PASTE_ZONE_TABLE_HEADER:
            in_table = True
            result.append(line)
            continue
        if in_table:
            if not line.startswith("|"):
                in_table = False
                result.append(line)
                continue
            if re.match(r"^\|\s*-+\s*\|", line):
                result.append(line)
                continue
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if len(cells) >= 4:
                match = re.search(r"`\{([^}]+)\}`", cells[0])
                if match and match.group(1) == zone:
                    cells[2] = new_value
                    line = "| " + " | ".join(cells) + " |"
            result.append(line)
            continue
        result.append(line)
    return result


def insert_before_marker(recipe_lines: list[str], marker: str, block: str) -> list[str]:
    block_lines = block.splitlines()
    result: list[str] = []
    inserted = False
    for line in recipe_lines:
        if not inserted and marker in line:
            if result and result[-1].strip():
                result.append("")
            result.extend(block_lines)
            result.append("")
            inserted = True
        result.append(line)
    if not inserted:
        raise ValueError(f"marker not found: {marker!r}")
    return result


def remove_preview_from_details(recipe_lines: list[str], preview: str) -> list[str]:
    text = "\n".join(recipe_lines)
    marker = "<summary><strong>Filled example</strong></summary>"
    if marker not in text or preview not in text:
        return recipe_lines
    before, rest = text.split(marker, 1)
    details, after_details = rest.split("</details>", 1)
    new_details = details.replace(preview, "")
    new_details = re.sub(r"\n{3,}", "\n\n", new_details)
    return (before + marker + new_details + "</details>" + after_details).splitlines()


def apply_hoist_to_recipe_lines(recipe_lines: list[str], plan: dict[str, object]) -> list[str]:
    lines = list(recipe_lines)
    lines = retarget_paste_zone_example(lines, str(plan["zone"]), str(plan["retarget_example_value"]))
    lines = insert_before_marker(lines, str(plan["insert_before"]), str(plan["preview"]))
    if plan.get("remove_from_details"):
        lines = remove_preview_from_details(lines, str(plan["preview"]))
    return lines


def apply_hoists(readme: Path, plans: list[dict[str, object]]) -> int:
    hoist_plans = [plan for plan in plans if plan["action"] == "hoist"]
    if not hoist_plans:
        return 0

    lines = readme.read_text(encoding="utf-8").splitlines()
    errors: list[checker.Diagnostic] = []
    recipes = checker.parse_recipes(lines, errors)
    if errors:
        raise ApplyError(errors)

    recipes_by_name = {recipe.name: recipe for recipe in recipes}
    mutations: dict[int, list[str]] = {}
    for plan in hoist_plans:
        recipe = recipes_by_name[str(plan["recipe"])]
        current = mutations.get(recipe.start, list(recipe.lines))
        mutations[recipe.start] = apply_hoist_to_recipe_lines(current, plan)

    new_lines: list[str] = []
    cursor = 0
    for recipe in recipes:
        if cursor < recipe.start:
            new_lines.extend(lines[cursor:recipe.start])
        new_lines.extend(mutations.get(recipe.start, recipe.lines))
        cursor = recipe.end
    new_lines.extend(lines[cursor:])

    write_readme_atomic(readme, new_lines)
    return len(hoist_plans)


def write_readme_atomic(readme: Path, lines: list[str]) -> None:
    text = "\n".join(lines)
    if text and not text.endswith("\n"):
        text += "\n"
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=readme.parent,
        delete=False,
        suffix=".tmp",
    ) as handle:
        handle.write(text)
        temp_path = Path(handle.name)
    temp_path.replace(readme)


def print_plan(plans: list[dict[str, object]]) -> None:
    if not plans:
        print("No paste-preview hoist actions planned.")
        return
    for item in plans:
        print(f"{item['recipe']} {{{item['zone']}}}: {item['action']}")
        if item["action"] == "hoist":
            print(f"  insert before: {item['insert_before']}")
            print(f"  retarget table value: {item['retarget_example_value']}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--readme", default="README.md", help="README path")
    parser.add_argument("--dry-run", action="store_true", help="print planned hoists without editing README")
    parser.add_argument("--apply", action="store_true", help="apply planned hoists to README")
    args = parser.parse_args()
    readme = Path(args.readme)
    plans = plan_hoists(readme)
    print_plan(plans)
    if args.dry_run:
        return 0
    if args.apply:
        try:
            applied = apply_hoists(readme, plans)
        except ApplyError as exc:
            for error in exc.errors:
                print(f"error: {error.code} {error.message}", file=sys.stderr)
            return 1
        print(f"Applied {applied} hoist(s) to {readme}.")
        return 0
    pending = sum(1 for plan in plans if plan["action"] == "hoist")
    if pending:
        print(f"{pending} hoist(s) pending; use --apply or --dry-run.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
