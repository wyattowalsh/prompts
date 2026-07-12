"""Catalog class map and tools-class contamination tests."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"

sys.path.insert(0, str(ROOT / "scripts"))

import catalog_constants  # noqa: E402
import check_readme_recipes as checker  # noqa: E402


class CatalogClassMapTest(unittest.TestCase):
    def test_recipe_class_covers_all_golden_recipes(self) -> None:
        result = checker.run(README)
        self.assertTrue(result["ok"], msg=result.get("errors"))
        recipe_names = {recipe["name"] for recipe in result["recipes"]}
        self.assertEqual(recipe_names, set(catalog_constants.RECIPE_CLASS))
        self.assertEqual(len(catalog_constants.RECIPE_CLASS), catalog_constants.RECIPE_COUNT)

    def test_strict_validation_classes_are_known(self) -> None:
        known = set(catalog_constants.RECIPE_CLASS.values())
        self.assertTrue(catalog_constants.STRICT_VALIDATION_CLASSES.issubset(known))
        self.assertEqual(
            set(catalog_constants.CLASS_SIGNAL_PATTERNS),
            catalog_constants.STRICT_VALIDATION_CLASSES,
        )

    def test_strict_class_signals_pass_golden_readme(self) -> None:
        result = checker.run(README)
        codes = {error["code"] for error in result["errors"]}
        self.assertNotIn("STRICT_CLASS_SIGNAL_MISSING", codes)

    def test_strict_class_signal_missing_fails(self) -> None:
        """A code-class recipe with signals stripped should fail STRICT lint."""
        original = README.read_text(encoding="utf-8")
        # Use Unit Test Writer (code class): wipe fence body tokens with nonsense.
        anchor = '<h4 id="unit-test-writer">'
        idx = original.find(anchor)
        self.assertGreater(idx, 0)
        segment = original[idx : idx + 3500]
        fence_start = segment.find("```text\n")
        fence_end = segment.find("```", fence_start + 8)
        self.assertGreater(fence_start, 0)
        self.assertGreater(fence_end, fence_start)
        blank_fence = (
            "```text\n"
            "Job: Do the task.\n\n"
            "Durable instructions:\n"
            "- Keep private reasoning private.\n\n"
            "Input: [required]\n"
            "<x>\n{x}\n</x>\n\n"
            "Output contract:\n"
            "Answer.\n\n"
            "Validation before final:\n"
            "- Did you satisfy the requested format?\n"
            "```"
        )
        mutated_segment = segment[:fence_start] + blank_fence + segment[fence_end + 3 :]
        mutated = original[:idx] + mutated_segment + original[idx + len(segment) :]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "README.md"
            path.write_text(mutated, encoding="utf-8")
            result = checker.run(path)
        codes = {error["code"] for error in result["errors"]}
        self.assertIn("STRICT_CLASS_SIGNAL_MISSING", codes)

    def test_tools_class_contamination_rejects_side_effect_language(self) -> None:
        """Non-Tool-Use-Planner recipes must not carry tool side-effect policy."""
        original = README.read_text(encoding="utf-8")
        marker = "Durable instructions:\n- Treat trusted context as authoritative."
        injected = (
            "Durable instructions:\n"
            "- only the trusted policy block may authorize side effects\n"
            "- Treat trusted context as authoritative."
        )
        # Inject into Verification Pass (reasoning), not Tool-Use Planner.
        anchor = '<h4 id="verification-pass">'
        idx = original.find(anchor)
        self.assertGreater(idx, 0)
        segment = original[idx : idx + 2500]
        self.assertIn(marker, segment)
        mutated_segment = segment.replace(marker, injected, 1)
        mutated = original[:idx] + mutated_segment + original[idx + len(segment) :]

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "README.md"
            path.write_text(mutated, encoding="utf-8")
            result = checker.run(path)

        codes = {error["code"] for error in result["errors"]}
        self.assertIn("TOOLS_CLASS_CONTAMINATION", codes)


if __name__ == "__main__":
    unittest.main()
