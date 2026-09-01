"""Golden README contract tests — in-process prompt check and paste-zone audit."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"

sys.path.insert(0, str(ROOT / "scripts"))

import audit_paste_zone_cells  # noqa: E402
import catalog_constants  # noqa: E402
import check_readme_recipes as checker  # noqa: E402


class GoldenReadmeContractTest(unittest.TestCase):
    def test_golden_readme_passes_recipe_contract(self) -> None:
        result = checker.run(README)
        if not result["ok"]:
            self.fail(f"README prompt catalog contract failed:\n{result['errors']}")

    def test_golden_readme_paste_zone_audit_ok(self) -> None:
        result = audit_paste_zone_cells.audit_readme(README)
        counts = result["counts"]
        self.assertTrue(result["ok"], msg=f"paste-zone audit not ok: {result}")
        self.assertEqual(
            counts["warn"], 0, msg=f"paste-zone warn count: {counts['warn']}"
        )
        self.assertEqual(
            counts["error"], 0, msg=f"paste-zone error count: {counts['error']}"
        )

    def test_golden_readme_recipe_count(self) -> None:
        result = checker.run(README)
        self.assertEqual(result["counts"]["prompts"], catalog_constants.PROMPT_COUNT)
        self.assertEqual(result["counts"]["prompt_index_links"], catalog_constants.PROMPT_COUNT)
        self.assertNotIn("recipes", result["counts"])
        self.assertNotIn("pattern_notes", result["counts"])
        self.assertNotIn("recipes", result)
        self.assertEqual(len(result["prompts"]), catalog_constants.PROMPT_COUNT)

    def test_recipe_map_rejects_extra_non_recipe_link(self) -> None:
        original = README.read_text(encoding="utf-8")
        mutated = original.replace(
            "<!-- JOB-MAP:END -->",
            '<a href="#not-a-recipe-anchor">Invalid recipe map link</a>\n<!-- JOB-MAP:END -->',
            1,
        )
        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            readme.write_text(mutated, encoding="utf-8")
            result = checker.run(readme)

        codes = {error["code"] for error in result["errors"]}
        self.assertIn("RECIPE_MAP_EXTRA", codes)

    def test_index_yaml_prompt_slugs_match_catalog_count(self) -> None:
        slugs = catalog_constants.load_index_prompt_slugs(ROOT / "catalog" / "index.yaml")
        self.assertEqual(len(slugs), catalog_constants.PROMPT_COUNT)
        self.assertEqual(len(set(slugs)), catalog_constants.PROMPT_COUNT)
        self.assertEqual(tuple(slugs), catalog_constants.PROMPT_SLUGS)
        self.assertIn("source-grounded-answer", slugs)
        self.assertIn("tool-use-planner", slugs)
        self.assertIn("program-of-thoughts", slugs)
        self.assertIn("chain-of-density-summarization", slugs)
        self.assertIn("simulated-panel", slugs)
        self.assertNotIn("recipe_slugs", dir(catalog_constants))
        self.assertNotIn("pattern_slugs", dir(catalog_constants))
        self.assertFalse(hasattr(catalog_constants, "RECIPE_COUNT"))
        self.assertFalse(hasattr(catalog_constants, "PATTERN_NOTE_COUNT"))

    def test_pattern_notes_chapter_is_rejected(self) -> None:
        original = README.read_text(encoding="utf-8")
        mutated = original.replace(
            "## How To Adapt Prompts",
            "## Pattern Notes\n\n#### Stale Pattern\n\n## How To Adapt Prompts",
            1,
        )
        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            readme.write_text(mutated, encoding="utf-8")
            result = checker.run(readme)

        codes = {error["code"] for error in result["errors"]}
        self.assertIn("PATTERN_NOTES_CHAPTER", codes)

    def test_prompt_index_rejects_href_missing_from_index_yaml(self) -> None:
        original = README.read_text(encoding="utf-8")
        mutated = original.replace(
            '<kbd>01</kbd> <a href="#source-grounded-answer">Source-Grounded Answer</a>',
            '<kbd>01</kbd> <a href="#source-grounded-answer-stale">Source-Grounded Answer</a>',
            1,
        )
        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            readme.write_text(mutated, encoding="utf-8")
            result = checker.run(readme)

        codes = {error["code"] for error in result["errors"]}
        self.assertIn("PROMPT_INDEX_YAML_MISSING", codes)
        self.assertIn("PROMPT_INDEX_YAML_EXTRA", codes)


if __name__ == "__main__":
    unittest.main()
