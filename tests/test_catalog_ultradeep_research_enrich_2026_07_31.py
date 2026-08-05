"""Structural gates for catalog-ultradeep-research-enrich wave (+ RV-001..005 fix)."""
from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "goals" / "catalog-ultradeep-research-enrich"
# Ultradeep implementer wave (2026-07-31) and RV-001..005 surgical fix re-fetch (2026-08-01).
WAVE_DATES = ("2026-07-31", "2026-08-01")
TRACKS = [
    "api-controls",
    "classic-pe",
    "agents-eval-context",
    "multimodal",
    "rag-citation",
    "reasoning-controls",
    "provider-agent-frameworks",
    "safety-injection",
]


def _has_wave_date(text: str) -> bool:
    return any(d in text for d in WAVE_DATES)


class UltradeepResearchPackTests(unittest.TestCase):
    def test_required_tracks_complete(self) -> None:
        for name in TRACKS:
            path = PACK / "research" / "tracks" / f"{name}.md"
            self.assertTrue(path.is_file(), f"missing track {name}")
            text = path.read_text(encoding="utf-8")
            self.assertIn("**Status:** complete", text)
            self.assertTrue(_has_wave_date(text), f"track {name} missing wave date")
            self.assertTrue(
                "no-material:** true" in text or "| " in text,
                f"track {name} needs findings table or no-material",
            )

    def test_claim_map_and_residual(self) -> None:
        for rel in (
            "research/claim-card-map.md",
            "research/cascade-queue.md",
            "research/residual-gaps.md",
            "research/residual-seed.md",
            "research/extract-coverage.md",
            "summary.md",
            "ledger-card-changelog.md",
        ):
            path = PACK / rel
            self.assertTrue(path.is_file(), f"missing {rel}")
            self.assertGreater(path.stat().st_size, 80, f"stub {rel}")

    def test_extracts_exist_for_wave(self) -> None:
        extracts = list((PACK / "research" / "extracts").glob("*.md"))
        # INDEX.md + content extracts
        self.assertGreaterEqual(len(extracts), 20)
        index = PACK / "research" / "extracts" / "INDEX.md"
        self.assertTrue(index.is_file())
        # each non-INDEX extract has url + retrieved (retired extracts use replacement)
        for p in extracts:
            if p.name == "INDEX.md":
                continue
            text = p.read_text(encoding="utf-8")
            self.assertTrue(_has_wave_date(text), f"{p.name} missing wave date")
            if re.search(r"(?m)^-\s*status:\s*retired", text) or "PLATFORM-RETIRED" in p.name:
                self.assertTrue(
                    "replacement:" in text or "url:" in text or "old_url:" in text,
                    f"{p.name} retired extract needs replacement/url",
                )
                continue
            self.assertIn("url:", text)
            self.assertIn("claims:", text)


if __name__ == "__main__":
    unittest.main()
