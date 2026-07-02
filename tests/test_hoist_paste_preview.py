"""Unit tests for paste-preview hoist helper."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_readme_recipes as checker  # noqa: E402
import hoist_paste_preview as hoist  # noqa: E402


def _hidden_preview_recipe_lines() -> list[str]:
    preview = "\n".join(
        [
            "**Paste preview** (`{trusted_context}`):",
            "",
            "> Memo line one",
            "> Memo line two",
        ]
    )
    return [
        "#### Source-Grounded Answer",
        "",
        "Use for: answer from supplied sources",
        "",
        "| Placeholder | Req | Example value | Notes |",
        "| --- | --- | --- | --- |",
        "| `{question}` | yes | Should we ship? | go/no-go |",
        "| `{trusted_context}` | yes | see paste preview | excerpt |",
        "",
        "<!-- Copy prompt: -->",
        "",
        "```text",
        "Question: [required]",
        "<question>",
        "{question}",
        "</question>",
        "",
        "Trusted source excerpts: [required]",
        "<trusted_context>",
        "{trusted_context}",
        "</trusted_context>",
        "```",
        "",
        "Fill these in:",
        "",
        "Match the **placeholder table** above.",
        "",
        "Expected output:",
        "",
        "- A direct answer.",
        "",
        "<details>",
        "<summary>hidden preview</summary>",
        "",
        preview,
        "",
        "</details>",
    ]


def _mini_readme_with_recipe(recipe_lines: list[str]) -> list[str]:
    return [
        "## Prompt Library",
        "",
        "### Research",
        "",
        *recipe_lines,
        "",
        "## Pattern Notes",
    ]


class HoistPastePreviewTest(unittest.TestCase):
    def test_apply_hoist_moves_preview_above_copy_prompt(self) -> None:
        recipe_lines = _hidden_preview_recipe_lines()
        plan = {
            "recipe": "Source-Grounded Answer",
            "zone": "trusted_context",
            "action": "hoist",
            "preview": "\n".join(
                [
                    "**Paste preview** (`{trusted_context}`):",
                    "",
                    "> Memo line one",
                    "> Memo line two",
                ]
            ),
            "insert_before": "<!-- Copy prompt: -->",
            "remove_from_details": True,
            "retarget_example_value": "see preview below",
        }
        updated = hoist.apply_hoist_to_recipe_lines(recipe_lines, plan)
        recipe = checker.Recipe(
            name="Source-Grounded Answer",
            category="Research",
            line=1,
            start=0,
            end=len(updated),
            lines=updated,
        )
        errors: list[checker.Diagnostic] = []
        positions = checker.field_positions(recipe, errors)
        checker.validate_paste_preview_visibility(recipe, positions, errors)
        self.assertEqual(errors, [])
        self.assertIn("see preview below", "\n".join(updated))
        self.assertIn("**Paste preview** (`{trusted_context}`):", "\n".join(updated))
        details_regions = hoist.iter_details_regions("\n".join(updated))
        self.assertTrue(any("**Paste preview**" not in region for region in details_regions))

    def test_apply_on_temp_readme_integration(self) -> None:
        lines = _mini_readme_with_recipe(_hidden_preview_recipe_lines())
        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            readme.write_text("\n".join(lines) + "\n", encoding="utf-8")
            plans = hoist.plan_hoists(readme)
            pending = [plan for plan in plans if plan["action"] == "hoist"]
            self.assertEqual(len(pending), 1)
            applied = hoist.apply_hoists(readme, plans)
            self.assertEqual(applied, 1)
            errors: list[checker.Diagnostic] = []
            recipes = checker.parse_recipes(readme.read_text(encoding="utf-8").splitlines(), errors)
            self.assertEqual(errors, [])
            recipe = next(item for item in recipes if item.name == "Source-Grounded Answer")
            positions = checker.field_positions(recipe, errors)
            checker.validate_paste_preview_visibility(recipe, positions, errors)
            self.assertEqual(errors, [])

    def test_dry_run_on_golden_readme_reports_no_pending_hoists(self) -> None:
        readme = ROOT / "README.md"
        if not readme.exists():
            self.skipTest("README.md not present")
        plans = hoist.plan_hoists(readme)
        pending = [plan for plan in plans if plan["action"] == "hoist"]
        self.assertEqual(pending, [], msg=f"unexpected pending hoists: {pending}")


if __name__ == "__main__":
    unittest.main()
