"""Semantic contract tests for README catalog steward evals."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVALS = ROOT / ".agents" / "skills" / "readme-catalog-steward" / "evals" / "evals.json"


class ReadmeCatalogStewardEvalsTest(unittest.TestCase):
    def load_evals(self) -> dict[str, object]:
        return json.loads(EVALS.read_text(encoding="utf-8"))

    def eval_text(self, eval_id: str) -> str:
        data = self.load_evals()
        evaluation = next(item for item in data["evals"] if item["id"] == eval_id)
        return "\n".join(
            [
                evaluation["expected_output"],
                *evaluation["expected_behavior"],
                *evaluation["assertions"],
            ]
        )

    def test_badge_workflows_use_catalog_owned_canonical_commands(self) -> None:
        add_card = self.eval_text("explicit-add-card")
        self.assertIn("catalog YAML", add_card)
        self.assertIn("pnpm catalog:readme", add_card)

        badge_pass = self.eval_text("explicit-badge-pass")
        self.assertIn("catalog YAML", badge_pass)
        self.assertIn("pnpm catalog:readme", badge_pass)
        self.assertIn("pnpm run badges:urls", badge_pass)
        self.assertIn("bounded", badge_pass)

        validate = self.eval_text("explicit-validate")
        self.assertIn("pnpm catalog:readme:check", validate)
        self.assertIn("pnpm run badges:urls", validate)

    def test_retired_script_owned_and_conditional_curl_wording_is_absent(self) -> None:
        corpus = json.dumps(self.load_evals(), sort_keys=True)
        retired_wording = (
            "Updates badge/heading config in scripts/update_readme_badges.py",
            "Uses scripts/update_readme_badges.py for generated blocks",
            "Runs badge --check and curl-verifies changed URLs when applicable",
        )
        for wording in retired_wording:
            with self.subTest(wording=wording):
                self.assertNotIn(wording, corpus)
        self.assertNotIn("curl", corpus.casefold())


if __name__ == "__main__":
    unittest.main()
