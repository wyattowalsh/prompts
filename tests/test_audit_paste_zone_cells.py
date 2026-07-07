"""Unit tests for audit_paste_zone_cells.py."""

from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import audit_paste_zone_cells as audit  # noqa: E402

WARN_LENGTH = audit.WARN_LENGTH
ERROR_LENGTH = audit.ERROR_LENGTH


def _compact_fill_block() -> str:
    return "Match the **placeholder table** above; paste `none` for optional zones you omit."


def _html_recipe_heading(*, slug: str, name: str) -> list[str]:
    return [
        f'<h4 id="{slug}">',
        f'  <img src="https://shieldcn.dev/badge/-2563EB.svg" alt="{name}" title="{name}" '
        f'height="28" style="vertical-align:text-bottom;margin-right:0.35em;" />',
        f"  {name}",
        "</h4>",
    ]


def _sample_paste_zone_table(*, trusted_example: str = "Memo excerpt") -> str:
    return "\n".join(
        [
            "| Placeholder | Req | Example value | Notes |",
            "| --- | --- | --- | --- |",
            "| `{question}` | yes | Should we ship? | go/no-go |",
            f"| `{{trusted_context}}` | yes | {trusted_example} | excerpt |",
        ]
    )


def _sample_recipe_lines(paste_zone_block: str) -> list[str]:
    fill_lines = _compact_fill_block().splitlines()
    return [
        "Use for: answer a question from supplied sources",
        "",
        *paste_zone_block.splitlines(),
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


def _mini_readme_lines(*, trusted_example: str = "Memo excerpt") -> list[str]:
    table = _sample_paste_zone_table(trusted_example=trusted_example)
    return [
        "## Prompt Library",
        "",
        "### Fixture Category",
        "",
        *_html_recipe_heading(slug="source-grounded-answer", name="Source-Grounded Answer"),
        "",
        *_sample_recipe_lines(table),
    ]


def _example_of_length(length: int) -> str:
    return "x" * length


def _write_mini_readme(tmp: str, *, trusted_example: str = "Memo excerpt") -> Path:
    readme = Path(tmp) / "README.md"
    readme.write_text("\n".join(_mini_readme_lines(trusted_example=trusted_example)), encoding="utf-8")
    return readme


class AuditPasteZoneCellsTest(unittest.TestCase):
    def test_audit_cell_ok_under_warn(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            readme = _write_mini_readme(tmp, trusted_example=_example_of_length(WARN_LENGTH))
            result = audit.audit_readme(readme)
            self.assertTrue(result["ok"])
            rows = result["rows"]
            self.assertEqual(len(rows), 2)
            self.assertTrue(all(row["status"] == "ok" for row in rows))

    def test_audit_cell_warn_strict(self) -> None:
        warn_example = _example_of_length(WARN_LENGTH + 1)
        self.assertLessEqual(len(warn_example), ERROR_LENGTH)

        with tempfile.TemporaryDirectory() as tmp:
            readme = _write_mini_readme(tmp, trusted_example=warn_example)
            result = audit.audit_readme(readme)
            self.assertTrue(result["ok"])
            trusted_row = next(row for row in result["rows"] if row["placeholder"] == "`{trusted_context}`")
            self.assertEqual(trusted_row["status"], "warn")

            argv = [
                "audit_paste_zone_cells.py",
                "--readme",
                str(readme),
                "--check",
                "--strict-warn",
            ]
            with patch.object(sys, "argv", argv):
                self.assertEqual(audit.main(), 1)

    def test_audit_cell_error_check(self) -> None:
        error_example = _example_of_length(ERROR_LENGTH + 1)

        with tempfile.TemporaryDirectory() as tmp:
            readme = _write_mini_readme(tmp, trusted_example=error_example)
            result = audit.audit_readme(readme)
            self.assertFalse(result["ok"])
            trusted_row = next(row for row in result["rows"] if row["placeholder"] == "`{trusted_context}`")
            self.assertEqual(trusted_row["status"], "error")

            argv = ["audit_paste_zone_cells.py", "--readme", str(readme), "--check"]
            with patch.object(sys, "argv", argv):
                self.assertEqual(audit.main(), 1)

    def test_audit_preview_pointer_skipped(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            readme = _write_mini_readme(tmp, trusted_example="see preview below")
            result = audit.audit_readme(readme)
            placeholders = {row["placeholder"] for row in result["rows"]}
            example_values = {row["example_value"] for row in result["rows"]}
            self.assertNotIn("`{trusted_context}`", placeholders)
            self.assertTrue(all(value.lower() != "see preview below" for value in example_values))

    def test_audit_json_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            readme = _write_mini_readme(tmp)
            argv = ["audit_paste_zone_cells.py", "--readme", str(readme), "--json"]
            buffer = io.StringIO()
            with patch.object(sys, "argv", argv), redirect_stdout(buffer):
                self.assertEqual(audit.main(), 0)
            payload = json.loads(buffer.getvalue())
            self.assertIn("counts", payload)
            for key in ("recipes", "cells", "warn", "error"):
                self.assertIn(key, payload["counts"])

    def test_check_fails_when_prompt_library_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            readme.write_text("# Empty\n", encoding="utf-8")
            result = audit.audit_readme(readme)

            self.assertFalse(result["ok"])
            self.assertEqual(result["counts"]["recipes"], 0)
            codes = {error["code"] for error in result["parse_errors"]}
            self.assertIn("MISSING_SECTION", codes)

            argv = ["audit_paste_zone_cells.py", "--readme", str(readme), "--check"]
            with patch.object(sys, "argv", argv):
                self.assertEqual(audit.main(), 1)


if __name__ == "__main__":
    unittest.main()
