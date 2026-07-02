"""Unit tests for filled-example and paste-zone linter helpers."""

from __future__ import annotations

import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_readme_recipes as checker  # noqa: E402


def _sample_recipe_lines(paste_zone_block: str) -> list[str]:
    return [
        "Use for: answer a question from supplied sources",
        "",
        paste_zone_block,
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
        "- `{question}` (required): The question to answer.",
        "- `{trusted_context}` (required): Source excerpts the answer may rely on.",
        "",
        "Expected output:",
        "",
        "- A direct answer.",
    ]


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


class RecipePasteZoneRulesTest(unittest.TestCase):
    def test_valid_paste_zone_table_passes(self) -> None:
        table = "\n".join(
            [
                "| Placeholder | Req | Example value | Notes |",
                "| --- | --- | --- | --- |",
                "| `{question}` | yes | Should we ship? | go/no-go |",
                "| `{trusted_context}` | yes | see paste preview | excerpt |",
            ]
        )
        fill = {"question": ("required", 1), "trusted_context": ("required", 1)}
        errors = checker.collect_recipe_paste_zone_errors("Source-Grounded Answer", _sample_recipe_lines(table), fill)
        self.assertEqual(errors, [])

    def test_missing_paste_zone_header_fails(self) -> None:
        errors = checker.collect_recipe_paste_zone_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(""),
            {"question": ("required", 1), "trusted_context": ("required", 1)},
        )
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_ZONE_TABLE", codes)

    def test_paste_zone_only_inside_details_fails(self) -> None:
        table = "\n".join(
            [
                "<details>",
                "<summary>hidden</summary>",
                "",
                "| Placeholder | Req | Example value | Notes |",
                "| --- | --- | --- | --- |",
                "| `{question}` | yes | Should we ship? | go/no-go |",
                "",
                "</details>",
            ]
        )
        errors = checker.collect_recipe_paste_zone_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(table),
            {"question": ("required", 1), "trusted_context": ("required", 1)},
        )
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_ZONE_IN_DETAILS", codes)

    def test_req_mismatch_fails(self) -> None:
        table = "\n".join(
            [
                "| Placeholder | Req | Example value | Notes |",
                "| --- | --- | --- | --- |",
                "| `{question}` | no | Should we ship? | go/no-go |",
                "| `{trusted_context}` | yes | Memo excerpt | excerpt |",
            ]
        )
        errors = checker.collect_recipe_paste_zone_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(table),
            {"question": ("required", 1), "trusted_context": ("required", 1)},
        )
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_ZONE_REQ_MISMATCH", codes)

    def test_meta_language_in_example_value_fails(self) -> None:
        table = "\n".join(
            [
                "| Placeholder | Req | Example value | Notes |",
                "| --- | --- | --- | --- |",
                "| `{question}` | yes | A diff that changes cache keys | go/no-go |",
                "| `{trusted_context}` | yes | Memo excerpt | excerpt |",
            ]
        )
        errors = checker.collect_recipe_paste_zone_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(table),
            {"question": ("required", 1), "trusted_context": ("required", 1)},
        )
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_ZONE_META", codes)

    def test_missing_placeholder_row_fails(self) -> None:
        table = "\n".join(
            [
                "| Placeholder | Req | Example value | Notes |",
                "| --- | --- | --- | --- |",
                "| `{question}` | yes | Should we ship? | go/no-go |",
            ]
        )
        errors = checker.collect_recipe_paste_zone_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(table),
            {"question": ("required", 1), "trusted_context": ("required", 1)},
        )
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_ZONE_PLACEHOLDER_COVERAGE", codes)


if __name__ == "__main__":
    unittest.main()
