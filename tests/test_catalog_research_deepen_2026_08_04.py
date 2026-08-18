"""Honesty and ship-shape invariants for prompt-catalog-research-deepen."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GOAL = ROOT / "goals" / "prompt-catalog-research-deepen"
PASS_DATE = "2026-08-04"
PRIOR_LIVE_UNION = {
    # upgrade 18
    "openai-prompt-engineering",
    "openai-structured-outputs",
    "openai-function-calling",
    "openai-reasoning",
    "openai-api-agent-evals",
    "openai-evaluation-best-practices",
    "anthropic-prompt-engineering-overview",
    "anthropic-extended-thinking",
    "anthropic-tool-use",
    "anthropic-build-with-claude-context-windows",
    "google-gemini-prompting-strategies",
    "google-gemini-structured-output",
    "google-gemini-thinking",
    "owasp-llm-top-10",
    "arxiv-2210-03629",
    "arxiv-2303-17651",
    "arxiv-2309-11495",
    "arxiv-2310-06117",
    # ultradeep 22 (union)
    "openai-api-agents-guardrails-approvals",
    "anthropic-structured-outputs",
    "google-gemini-function-calling",
    "nist-itl-ai-risk-management-framework",
    "arxiv-2305-10601",
    "prompt-report",
}


class CatalogResearchDeepenTests(unittest.TestCase):
    def test_live_ids_file_nonempty_and_expanded(self) -> None:
        live_path = GOAL / "LIVE_IDS.txt"
        self.assertTrue(live_path.is_file(), "LIVE_IDS.txt must exist")
        live_ids = {line.strip() for line in live_path.read_text().splitlines() if line.strip()}
        self.assertGreaterEqual(len(live_ids), 1, "LIVE_IDS must be non-empty")
        # Strict expansion: at least one id not in prior documented live union
        new_ids = live_ids - PRIOR_LIVE_UNION
        self.assertGreaterEqual(
            len(new_ids),
            1,
            f"LIVE set must expand beyond prior documented live sets; got only {sorted(live_ids)}",
        )
        # Honesty: must not claim all 124 as live without evidence file size
        self.assertLess(
            len(live_ids),
            124,
            "Do not bulk-mark all 124 sources live without full fetch evidence",
        )

    def test_source_refresh_status_matches_live_ids(self) -> None:
        live_ids = {
            line.strip()
            for line in (GOAL / "LIVE_IDS.txt").read_text().splitlines()
            if line.strip()
        }
        body = (ROOT / "source-refresh.md").read_text()
        table_lines = [ln for ln in body.splitlines() if ln.startswith("|")]
        live_marks = []
        for ln in table_lines:
            if f"live 200 · {PASS_DATE}" not in ln:
                continue
            ids = re.findall(r"`([a-z0-9-]+)`", ln)
            self.assertTrue(ids, f"live Status row missing manifest id: {ln[:80]}")
            live_marks.append(ids[-1])
        self.assertEqual(
            set(live_marks),
            live_ids,
            "source-refresh live Status marks must equal LIVE_IDS.txt exactly",
        )
        # No leftover prior-date live marks in table rows
        for ln in table_lines:
            self.assertNotRegex(
                ln,
                r"live 200 · 2026-07-",
                f"stale live Status in table: {ln[:100]}",
            )

    def test_sources_yaml_last_checked_pass_date(self) -> None:
        text = (ROOT / "sources.yaml").read_text()
        dates = re.findall(r"last_checked:\s*(\d{4}-\d{2}-\d{2})", text)
        self.assertEqual(len(dates), 124)
        self.assertTrue(all(d == PASS_DATE for d in dates), set(dates))

    def test_card_changelog_documents_more_than_five_upgrades(self) -> None:
        log = (GOAL / "ledger-card-changelog.md").read_text()
        # Count upgrade table rows (pattern/recipe lines with cascade L1)
        upgrade_rows = [
            ln
            for ln in log.splitlines()
            if ln.startswith("| ")
            and "pattern" in ln
            or (ln.startswith("| ") and "recipe" in ln)
        ]
        # tighter: lines with L1 cascade marker in changelog table
        l1 = [ln for ln in log.splitlines() if "| L1 |" in ln or ln.rstrip().endswith("| L1 |")]
        # fallback count pipe rows after header that mention pattern/recipe upgrade
        material = [
            ln
            for ln in log.splitlines()
            if re.match(r"^\| [a-z0-9-]+ \| (pattern|recipe) \|", ln)
        ]
        self.assertGreaterEqual(
            len(material),
            6,
            f"changelog must list more than 5 upgraded cards; got {len(material)}",
        )
        self.assertIn("None", log)  # new cards none
        self.assertTrue(
            (GOAL / "ledger-gaps.md").is_file() and (GOAL / "ledger-gaps.md").stat().st_size > 50
        )
        self.assertTrue(
            (GOAL / "ledger-source-deltas.md").is_file()
            and (GOAL / "ledger-source-deltas.md").stat().st_size > 50
        )

    def test_upgraded_card_yaml_exists_and_has_sources(self) -> None:
        """Drive real shipped card files listed in the changelog (not a hard-coded stub)."""
        log = (GOAL / "ledger-card-changelog.md").read_text()
        rows = re.findall(
            r"^\| ([a-z0-9-]+) \| (pattern|recipe) \|",
            log,
            flags=re.M,
        )
        self.assertGreaterEqual(len(rows), 6)
        for slug, kind in rows:
            path = ROOT / "catalog" / ("patterns" if kind == "pattern" else "recipes") / f"{slug}.yaml"
            self.assertTrue(path.is_file(), f"missing catalog YAML for {slug}")
            text = path.read_text()
            self.assertIn("sources:", text)
            # at least one https source URL in the file
            self.assertRegex(text, r"https://")

    def test_pattern_prose_fields_have_no_orphan_leading_semicolon_lines(self) -> None:
        """Block README/catalog.json orphan Best-use lines like a lone '; use …'.

        Drives real shipped pattern YAML: no prose field line may start with ';' or ','.
        """
        fields = (
            "best_use",
            "avoid_when",
            "definition",
            "model_api_controls",
            "failure_modes",
            "caveat",
        )
        bad: list[str] = []
        for path in sorted((ROOT / "catalog" / "patterns").glob("*.yaml")):
            text = path.read_text(encoding="utf-8")
            # Parse only the simple block fields we author (no full YAML dep required).
            for field in fields:
                m = re.search(
                    rf"(?ms)^{re.escape(field)}:\s*(?:\|\s*\n((?:[ \t]+.*\n)+)|([^\n]+)\n)",
                    text,
                )
                if not m:
                    continue
                body = m.group(1) if m.group(1) is not None else m.group(2) or ""
                for ln in body.splitlines():
                    stripped = ln.strip()
                    if stripped.startswith(";") or stripped.startswith(","):
                        bad.append(f"{path.name}:{field}:{stripped!r}")
        self.assertEqual(bad, [], msg=f"orphan punctuation prose lines: {bad}")

        # Explicit skeptic regression: evaluation-flywheel best_use is continuous prose.
        fly = (ROOT / "catalog" / "patterns" / "evaluation-flywheel.yaml").read_text(
            encoding="utf-8"
        )
        self.assertIn("best_use:", fly)
        self.assertNotRegex(fly, r"(?m)^[ \t]+;[ \t]*use official")
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        idx = readme.find("Evaluation Flywheel")
        self.assertNotEqual(idx, -1)
        snippet = readme[idx : idx + 800]
        self.assertNotRegex(snippet, r"(?m)^\s*;\s*use official")


if __name__ == "__main__":
    unittest.main()
