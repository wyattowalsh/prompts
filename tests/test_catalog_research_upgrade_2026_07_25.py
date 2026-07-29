"""Regression checks for goals/prompt-catalog-research-upgrade (as of 2026-07-25).

Drives real shipped files. Documents honest provenance:
- last_checked is inventory-refresh date (sources.yaml header).
- Only LIVE_IDS.txt entries are marked live HTTP 200 in source-refresh Status.
"""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_sources_manifest  # noqa: E402

AS_OF = "2026-07-25"
SOURCE_MANIFEST = ROOT / "sources.yaml"
SOURCE_REFRESH = ROOT / "source-refresh.md"
LIVE_IDS_PATH = ROOT / "goals/prompt-catalog-research-upgrade/LIVE_IDS.txt"

UPGRADED_RECIPES = {
    "tool-use-planner": ROOT / "catalog/recipes/tool-use-planner.yaml",
    "prompt-injection-scanner": ROOT / "catalog/recipes/prompt-injection-scanner.yaml",
}
UPGRADED_PATTERNS = {
    "tool-calling-contract": ROOT / "catalog/patterns/tool-calling-contract.yaml",
    "structured-outputs-json-schema": ROOT
    / "catalog/patterns/structured-outputs-json-schema.yaml",
    "react": ROOT / "catalog/patterns/react.yaml",
}


def live_ids() -> list[str]:
    return [line.strip() for line in LIVE_IDS_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]


class CatalogResearchUpgrade20260725Test(unittest.TestCase):
    def test_manifest_check_passes_via_shipped_checker(self) -> None:
        result = check_sources_manifest.run(SOURCE_MANIFEST, SOURCE_REFRESH)
        self.assertTrue(result["ok"], msg=result["errors"])
        # Inventory size smoke (not a live-fetch count).
        self.assertGreaterEqual(len(result["entries"]), 100)

    def test_inventory_last_checked_date_on_all_entries(self) -> None:
        """All last_checked equal AS_OF means inventory refresh, not live re-check."""
        entries = check_sources_manifest.parse_manifest(SOURCE_MANIFEST)
        self.assertGreaterEqual(len(entries), 100)
        stale = [e["id"] for e in entries if e.get("last_checked") != AS_OF]
        self.assertEqual(stale, [], msg=f"stale last_checked: {stale[:10]}")

    def test_source_refresh_distinguishes_inventory_vs_live(self) -> None:
        text = SOURCE_REFRESH.read_text(encoding="utf-8")
        self.assertIn(f"Freshness date: {AS_OF}.", text)
        lowered = text.lower()
        self.assertTrue(
            "inventory-refresh" in lowered or "inventory refresh" in lowered,
            msg="expected inventory-refresh language in source-refresh.md",
        )
        self.assertIn("inventory 2026-07-25", text)
        self.assertIn("live 200 · 2026-07-25", text)
        self.assertIn("prompt-catalog-research-upgrade", text)
        # Legacy Status grammar must be gone.
        self.assertNotRegex(text, r"\|\s*checked 2026-07-25\s*\|")

    def test_live_status_count_matches_live_ids_file(self) -> None:
        text = SOURCE_REFRESH.read_text(encoding="utf-8")
        # Count Status cells in table rows only (not method prose).
        live_marks = 0
        for line in text.splitlines():
            if not line.startswith("|") or "`" not in line:
                continue
            if "Manifest id" in line or re.match(r"^\|\s*---", line):
                continue
            if "live 200 · 2026-07-25" in line:
                live_marks += 1
        ids = live_ids()
        self.assertEqual(len(ids), 18)
        self.assertEqual(live_marks, 18)
        for mid in ids:
            self.assertIn(f"`{mid}`", text)

    def test_upgraded_recipes_exist_with_sources_and_control_notes(self) -> None:
        for slug, path in UPGRADED_RECIPES.items():
            with self.subTest(slug=slug):
                self.assertTrue(path.is_file(), msg=path)
                text = path.read_text(encoding="utf-8")
                self.assertIn(f"slug: {slug}", text)
                self.assertIn("sources:", text)
                self.assertIn("https://", text)
                self.assertIn("control_evidence_note:", text)
                self.assertIn("safety_eval_checks:", text)
                # At most one markdown link in control note block.
                # Grab control_evidence_note section until next top-level key-ish line.
                m = re.search(
                    r"control_evidence_note:\s*\|?\s*\n((?:[ \t]+.+\n)+)",
                    text,
                )
                self.assertIsNotNone(m)
                note = m.group(1)
                self.assertLessEqual(note.count("](http"), 1)

    def test_upgraded_patterns_exist_with_sources_and_controls(self) -> None:
        for slug, path in UPGRADED_PATTERNS.items():
            with self.subTest(slug=slug):
                self.assertTrue(path.is_file(), msg=path)
                text = path.read_text(encoding="utf-8")
                self.assertIn(f"slug: {slug}", text)
                self.assertIn("sources:", text)
                self.assertIn("https://", text)
                self.assertIn("model_api_controls:", text)
                self.assertIn("eval_required:", text)

    def test_tool_use_planner_mentions_function_calling_control(self) -> None:
        text = UPGRADED_RECIPES["tool-use-planner"].read_text(encoding="utf-8")
        self.assertIn("function-calling", text)
        self.assertIn(
            "https://developers.openai.com/api/docs/guides/function-calling",
            text,
        )
        self.assertIn("Sources", text)

    def test_structured_outputs_pattern_prefers_host_enforced_api(self) -> None:
        text = UPGRADED_PATTERNS["structured-outputs-json-schema"].read_text(
            encoding="utf-8"
        )
        self.assertRegex(
            text,
            re.compile(r"host-enforced structured output|Structured Outputs", re.I),
        )
        self.assertIn(
            "https://developers.openai.com/api/docs/guides/structured-outputs",
            text,
        )

    def test_react_pattern_still_cites_primary_paper(self) -> None:
        text = UPGRADED_PATTERNS["react"].read_text(encoding="utf-8")
        self.assertIn("https://arxiv.org/abs/2210.03629", text)
        self.assertIn("inventing tool results", text)

    def test_sources_notes_lack_stale_verified_phrase(self) -> None:
        text = SOURCE_MANIFEST.read_text(encoding="utf-8")
        self.assertNotIn("verified 200 on 2026-07-12", text)


if __name__ == "__main__":
    unittest.main()
