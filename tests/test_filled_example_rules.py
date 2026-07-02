"""Unit tests for filled-example linter helpers."""

from __future__ import annotations

import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_readme_recipes as checker  # noqa: E402


class FilledExampleRulesTest(unittest.TestCase):
    def test_field_matches_output_row_prefix(self) -> None:
        self.assertTrue(checker.field_matches_output_row("Findings", "Findings by severity"))
        self.assertFalse(checker.field_matches_output_row("Direct answer", "Summary"))

    def test_output_table_field_names_strips_markdown(self) -> None:
        rows = ["| **Findings by severity** | High issue |"]
        self.assertEqual(checker.output_table_field_names(rows), ["Findings by severity"])

    def test_positive_fixture_case_passes(self) -> None:
        manifest = checker.FIXTURES_DIR / "manifest.json"
        self.assertTrue(manifest.exists())
        result = checker.run_fixture_checks()
        self.assertTrue(result["ok"], msg=str(result.get("failures")))


if __name__ == "__main__":
    unittest.main()
