"""Unit tests for paste-zone linter helpers."""

from __future__ import annotations

import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_readme_recipes as checker  # noqa: E402


def _compact_fill_block() -> str:
    return "Match the **Paste zones** table above; paste `none` for optional zones you omit."


def _sample_recipe_lines(paste_zone_block: str, *, fill_block: str | None = None, preview_block: str = "") -> list[str]:
    fill_lines = (fill_block or _compact_fill_block()).splitlines()
    body = [
        "Use for: answer a question from supplied sources",
        "",
        *paste_zone_block.splitlines(),
    ]
    if preview_block:
        body.extend(["", *preview_block.splitlines()])
    body.extend(
        [
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
            *fill_lines,
            "",
            "Expected output:",
            "",
            "- A direct answer.",
        ]
    )
    return body


def _sample_paste_zone_table(*, trusted_example: str = "Memo excerpt") -> str:
    return "\n".join(
        [
            "| Placeholder | Req | Example value | Notes |",
            "| --- | --- | --- | --- |",
            "| `{question}` | yes | Should we ship? | go/no-go |",
            f"| `{{trusted_context}}` | yes | {trusted_example} | excerpt |",
        ]
    )


class RecipePasteZoneRulesTest(unittest.TestCase):
    def test_fill_entries_from_paste_zone_table(self) -> None:
        table = _sample_paste_zone_table()
        recipe = checker.Recipe(
            name="Source-Grounded Answer",
            category="Fixture",
            line=1,
            start=0,
            end=0,
            lines=_sample_recipe_lines(table),
        )
        positions = checker.field_positions(recipe, [])
        fill = checker.paste_zone_fill_entries(recipe, positions)
        self.assertEqual(
            fill,
            {
                "question": ("required", 5),
                "trusted_context": ("required", 6),
            },
        )
        self.assertEqual(checker.fill_entries(recipe, positions), fill)

    def test_valid_paste_zone_table_passes(self) -> None:
        table = _sample_paste_zone_table(trusted_example="see paste preview")
        preview = "\n".join(
            [
                "**Paste preview** (`{trusted_context}`):",
                "",
                "> Memo excerpt.",
            ]
        )
        errors = checker.collect_recipe_paste_zone_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(table, preview_block=preview),
        )
        self.assertEqual(errors, [])

    def test_missing_paste_zone_header_fails(self) -> None:
        errors = checker.collect_recipe_paste_zone_errors("Source-Grounded Answer", _sample_recipe_lines(""))
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
        errors = checker.collect_recipe_paste_zone_errors("Source-Grounded Answer", _sample_recipe_lines(table))
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
        fill = {"question": ("required", 1), "trusted_context": ("required", 1)}
        errors = checker.collect_recipe_paste_zone_errors("Source-Grounded Answer", _sample_recipe_lines(table), fill)
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
        errors = checker.collect_recipe_paste_zone_errors("Source-Grounded Answer", _sample_recipe_lines(table))
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
        fill = {"question": ("required", 1), "trusted_context": ("required", 1)}
        errors = checker.collect_recipe_paste_zone_errors("Source-Grounded Answer", _sample_recipe_lines(table), fill)
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_ZONE_PLACEHOLDER_COVERAGE", codes)

    def test_compact_fill_these_in_passes(self) -> None:
        errors = checker.collect_recipe_validation_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(_sample_paste_zone_table()),
        )
        codes = {error.code for error in errors}
        self.assertNotIn("FILL_THESE_IN_COMPACT", codes)
        self.assertNotIn("FILL_THESE_IN_OPTIONAL_NONE", codes)

    def test_canonical_fill_these_in_passes(self) -> None:
        errors = checker.collect_recipe_validation_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(
                _sample_paste_zone_table(),
                fill_block=checker.FILL_CANONICAL_POINTER,
            ),
        )
        codes = {error.code for error in errors}
        self.assertNotIn("FILL_THESE_IN_OPTIONAL_NONE", codes)

    def test_fill_missing_optional_none_fails(self) -> None:
        errors = checker.collect_recipe_validation_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(
                _sample_paste_zone_table(),
                fill_block="Match the **Paste zones** table above.",
            ),
        )
        codes = {error.code for error in errors}
        self.assertIn("FILL_THESE_IN_OPTIONAL_NONE", codes)

    def test_bullet_fill_these_in_fails(self) -> None:
        bullets = "\n".join(
            [
                "- `{question}` (required): The question to answer.",
                "- `{trusted_context}` (required): Source excerpts the answer may rely on.",
            ]
        )
        errors = checker.collect_recipe_validation_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(_sample_paste_zone_table(), fill_block=bullets),
        )
        codes = {error.code for error in errors}
        self.assertIn("FILL_THESE_IN_COMPACT", codes)

    def test_paste_preview_visible_passes(self) -> None:
        table = _sample_paste_zone_table(trusted_example="see preview below")
        preview = "\n".join(
            [
                "**Paste preview** (`{trusted_context}`):",
                "",
                "> Memo excerpt.",
            ]
        )
        errors = checker.collect_recipe_validation_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(table, preview_block=preview),
        )
        codes = {error.code for error in errors}
        self.assertNotIn("RECIPE_PASTE_PREVIEW_HIDDEN", codes)

    def test_paste_preview_only_in_details_fails(self) -> None:
        table = _sample_paste_zone_table(trusted_example="see paste preview")
        lines = _sample_recipe_lines(table)
        lines.extend(
            [
                "",
                "<details>",
                "<summary>hidden</summary>",
                "",
                "**Paste preview** (`{trusted_context}`):",
                "",
                "> Memo excerpt.",
                "",
                "</details>",
            ]
        )
        errors = checker.collect_recipe_validation_errors("Source-Grounded Answer", lines)
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_PREVIEW_HIDDEN", codes)

    def test_example_value_too_long_fails(self) -> None:
        long_value = "x" * 81
        table = _sample_paste_zone_table(trusted_example=long_value)
        errors = checker.collect_recipe_validation_errors(
            "Source-Grounded Answer",
            _sample_recipe_lines(table),
        )
        codes = {error.code for error in errors}
        self.assertIn("RECIPE_PASTE_ZONE_VALUE_LENGTH", codes)

    def test_per_recipe_before_copy_tip_fails(self) -> None:
        table = _sample_paste_zone_table()
        lines = _sample_recipe_lines(table)
        lines.insert(2, "> [!TIP]")
        lines.insert(3, "> **Before you copy:** use the paste zones table; for optional placeholders, paste `none` if unused.")
        errors = checker.collect_recipe_validation_errors("Source-Grounded Answer", lines)
        codes = {error.code for error in errors}
        self.assertIn("DUPLICATE_COPY_TIP", codes)


if __name__ == "__main__":
    unittest.main()
