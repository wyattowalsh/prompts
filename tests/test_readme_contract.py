"""Golden README contract tests — in-process recipe check and paste-zone audit."""

from __future__ import annotations

import sys
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


if __name__ == "__main__":
    unittest.main()
