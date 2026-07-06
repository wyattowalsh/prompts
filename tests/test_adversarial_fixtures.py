"""Adversarial safety fixture contract tests."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / ".agents" / "skills" / "readme-catalog-steward" / "evals" / "adversarial-fixtures.json"
README = ROOT / "README.md"

REQUIRED_FIXTURE_FIELDS = {
    "id",
    "category",
    "source_zone",
    "risk_mappings",
    "untrusted_input",
    "expected_handling",
    "required_boundaries",
}
REQUIRED_CATEGORIES = {"prompt-injection", "unsafe-output", "cost-dos"}
REQUIRED_RISK_PREFIXES = ("OWASP:", "NIST:", "MITRE:")
TRUST_ZONE_TERMS = [
    "durable instructions",
    "trusted context",
    "untrusted input",
    "tool permissions",
    "output contract",
    "validation",
]


class AdversarialFixturesTest(unittest.TestCase):
    def load_fixtures(self) -> dict[str, object]:
        return json.loads(FIXTURES.read_text(encoding="utf-8"))

    def test_fixture_schema_and_unique_ids(self) -> None:
        data = self.load_fixtures()
        fixtures = data["fixtures"]
        ids = set()
        for fixture in fixtures:
            missing = REQUIRED_FIXTURE_FIELDS - set(fixture)
            self.assertFalse(missing, msg=f"{fixture.get('id', '<unknown>')} missing {missing}")
            for field in ["id", "category", "source_zone", "untrusted_input", "expected_handling"]:
                self.assertIsInstance(fixture[field], str, msg=f"{fixture.get('id', '<unknown>')} {field}")
                self.assertTrue(fixture[field].strip(), msg=f"{fixture.get('id', '<unknown>')} {field}")
            self.assertRegex(fixture["id"], r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            self.assertNotIn(fixture["id"], ids)
            ids.add(fixture["id"])
            self.assertIn(fixture["category"], REQUIRED_CATEGORIES)
            self.assertIsInstance(fixture["risk_mappings"], list)
            self.assertTrue(fixture["risk_mappings"])
            for mapping in fixture["risk_mappings"]:
                self.assertIsInstance(mapping, str)
                self.assertTrue(mapping.startswith(REQUIRED_RISK_PREFIXES), msg=mapping)
            self.assertIsInstance(fixture["required_boundaries"], list)
            self.assertTrue(fixture["required_boundaries"])
            for boundary in fixture["required_boundaries"]:
                self.assertIn(boundary, TRUST_ZONE_TERMS)

    def test_required_risk_categories_are_covered(self) -> None:
        data = self.load_fixtures()
        categories = {fixture["category"] for fixture in data["fixtures"]}
        self.assertTrue(REQUIRED_CATEGORIES <= categories)

    def test_framework_mappings_are_present(self) -> None:
        data = self.load_fixtures()
        mappings = {
            mapping
            for fixture in data["fixtures"]
            for mapping in fixture["risk_mappings"]
        }
        for prefix in REQUIRED_RISK_PREFIXES:
            self.assertTrue(any(mapping.startswith(prefix) for mapping in mappings), msg=prefix)

    def test_readme_preserves_trust_boundary_terms(self) -> None:
        section = self.extract_section(
            README.read_text(encoding="utf-8"),
            "## Safety, Evals, And Trust Boundaries",
            "## Pattern Selection Matrix",
        )
        self.assertIn("### Trust Boundary Cheatsheet", section)
        self.assertIn("May change instructions?", section)
        self.assertIn("Required handling", section)
        for term in TRUST_ZONE_TERMS:
            self.assertIn(term, section)

    def extract_section(self, text: str, start: str, end: str) -> str:
        start_index = text.index(start)
        end_index = text.index(end, start_index)
        return text[start_index:end_index]


if __name__ == "__main__":
    unittest.main()
