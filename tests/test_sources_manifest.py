"""Source freshness manifest tests."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_MANIFEST = ROOT / "sources.yaml"

sys.path.insert(0, str(ROOT / "scripts"))

import check_sources_manifest  # noqa: E402


VALID_ENTRY = """\
- id: example-source
  owner: Example
  url: https://example.com/docs
  source_type: official doc
  status: checked
  last_checked: 2026-07-04
  claim_scope: Example claim.
  replacement_url: none
  notes: Example notes.
"""


class SourceManifestTest(unittest.TestCase):
    def test_golden_manifest_passes(self) -> None:
        result = check_sources_manifest.run(SOURCE_MANIFEST)
        self.assertTrue(result["ok"], msg=result["errors"])
        self.assertGreaterEqual(len(result["entries"]), 8)

    def test_missing_required_field_fails(self) -> None:
        text = VALID_ENTRY.replace("  notes: Example notes.\n", "")
        result = self.run_temp_manifest(text)
        self.assertFalse(result["ok"])
        self.assertIn("missing required fields: notes", result["errors"][0])

    def test_invalid_date_fails(self) -> None:
        text = VALID_ENTRY.replace("2026-07-04", "July 4 2026")
        result = self.run_temp_manifest(text)
        self.assertFalse(result["ok"])
        self.assertIn("last_checked must be an ISO date", result["errors"][0])

    def test_duplicate_url_fails(self) -> None:
        text = VALID_ENTRY + VALID_ENTRY.replace("example-source", "example-source-two")
        result = self.run_temp_manifest(text)
        self.assertFalse(result["ok"])
        self.assertTrue(any("duplicate url" in error for error in result["errors"]))

    def test_unknown_source_type_fails(self) -> None:
        text = VALID_ENTRY.replace("official doc", "blog-ish")
        result = self.run_temp_manifest(text)
        self.assertFalse(result["ok"])
        self.assertIn("source_type must be one of", result["errors"][0])

    def test_source_refresh_unknown_manifest_id_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "sources.yaml"
            refresh = Path(tmp) / "source-refresh.md"
            manifest.write_text(VALID_ENTRY, encoding="utf-8")
            refresh.write_text(
                "| Provider | Source | Type | Status | Manifest id | Implication |\n"
                "| --- | --- | --- | --- | --- | --- |\n"
                "| Example | [Docs](https://example.com/docs) | official doc | checked | `missing-id` | Example. |\n",
                encoding="utf-8",
            )
            result = check_sources_manifest.run(manifest, refresh)
        self.assertFalse(result["ok"])
        self.assertTrue(any("unknown manifest id missing-id" in error for error in result["errors"]))

    def test_source_refresh_url_mismatch_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "sources.yaml"
            refresh = Path(tmp) / "source-refresh.md"
            manifest.write_text(VALID_ENTRY, encoding="utf-8")
            refresh.write_text(
                "| Provider | Source | Type | Status | Manifest id | Implication |\n"
                "| --- | --- | --- | --- | --- | --- |\n"
                "| Example | [Docs](https://example.com/other) | official doc | checked | `example-source` | Example. |\n",
                encoding="utf-8",
            )
            result = check_sources_manifest.run(manifest, refresh)
        self.assertFalse(result["ok"])
        self.assertTrue(any("URL mismatch for example-source" in error for error in result["errors"]))

    def test_source_refresh_malformed_manifest_id_fails_even_with_valid_row(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "sources.yaml"
            refresh = Path(tmp) / "source-refresh.md"
            manifest.write_text(VALID_ENTRY, encoding="utf-8")
            refresh.write_text(
                "| Provider | Source | Type | Status | Manifest id | Implication |\n"
                "| --- | --- | --- | --- | --- | --- |\n"
                "| Example | [Docs](https://example.com/docs) | official doc | checked | `example-source` | Example. |\n"
                "| Bad | [Docs](https://example.com/docs) | official doc | checked | `Example_Source` | Bad. |\n",
                encoding="utf-8",
            )
            result = check_sources_manifest.run(manifest, refresh)
        self.assertFalse(result["ok"])
        self.assertTrue(any("invalid manifest id Example_Source" in error for error in result["errors"]))

    def test_source_refresh_only_malformed_manifest_id_reports_invalid_id(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "sources.yaml"
            refresh = Path(tmp) / "source-refresh.md"
            manifest.write_text(VALID_ENTRY, encoding="utf-8")
            refresh.write_text(
                "| Provider | Source | Type | Status | Manifest id | Implication |\n"
                "| --- | --- | --- | --- | --- | --- |\n"
                "| Bad | [Docs](https://example.com/docs) | official doc | checked | `Example_Source` | Bad. |\n",
                encoding="utf-8",
            )
            result = check_sources_manifest.run(manifest, refresh)
        self.assertFalse(result["ok"])
        self.assertTrue(any("invalid manifest id Example_Source" in error for error in result["errors"]))
        self.assertFalse(any("no source-refresh manifest IDs found" in error for error in result["errors"]))

    def run_temp_manifest(self, text: str) -> dict[str, object]:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sources.yaml"
            path.write_text(text, encoding="utf-8")
            return check_sources_manifest.run(path, source_refresh=None)


if __name__ == "__main__":
    unittest.main()
