"""Golden README contract tests — in-process recipe check and paste-zone audit."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"

sys.path.insert(0, str(ROOT / "scripts"))

import audit_paste_zone_cells  # noqa: E402
import check_readme_recipes as checker  # noqa: E402

RECIPE_COUNT = 48


class GoldenReadmeContractTest(unittest.TestCase):
    def test_golden_readme_passes_recipe_contract(self) -> None:
        result = checker.run(README)
        if not result["ok"]:
            self.fail(f"README recipe contract failed:\n{result['errors']}")

    def test_golden_readme_paste_zone_audit_ok(self) -> None:
        result = audit_paste_zone_cells.audit_readme(README)
        counts = result["counts"]
        self.assertTrue(result["ok"], msg=f"paste-zone audit not ok: {result}")
        self.assertEqual(counts["warn"], 0, msg=f"paste-zone warn count: {counts['warn']}")
        self.assertEqual(counts["error"], 0, msg=f"paste-zone error count: {counts['error']}")

    def test_golden_readme_recipe_count(self) -> None:
        result = checker.run(README)
        self.assertEqual(result["counts"]["recipes"], RECIPE_COUNT)

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


if __name__ == "__main__":
    unittest.main()
