"""Unit tests for recipe heading parse paths in check_readme_recipes."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_readme_recipes as checker  # noqa: E402


def _html_recipe_heading(*, slug: str, name: str, src: str = "https://shieldcn.dev/badge/-2563EB.svg") -> list[str]:
    return [
        f'<h4 id="{slug}">',
        f'  <img src="{src}" alt="{name}" title="{name}" height="28" '
        f'style="vertical-align:text-bottom;margin-right:0.35em;" />',
        f"  {name}",
        "</h4>",
    ]


def _mini_prompt_library(*recipe_headings: list[str]) -> list[str]:
    lines = [
        "## Prompt Library",
        "",
        "### Fixture Category",
        "",
    ]
    for heading_block in recipe_headings:
        lines.extend(heading_block)
        lines.append("")
        lines.append("Use for: fixture recipe body")
        lines.append("")
    return lines


class ParseRecipeHeadingNameTest(unittest.TestCase):
    def test_legacy_markdown_h4(self) -> None:
        lines = ["#### Source-Grounded Answer", "Use for: answer a question"]
        name, next_index = checker.parse_recipe_heading_name(lines[0], lines, 0)
        self.assertEqual(name, "Source-Grounded Answer")
        self.assertEqual(next_index, 1)

    def test_html_h4_with_icon_img_and_title(self) -> None:
        lines = _html_recipe_heading(slug="web-research-brief", name="Web Research Brief")
        lines.append("Use for: research the web")
        name, next_index = checker.parse_recipe_heading_name(lines[0], lines, 0)
        self.assertEqual(name, "Web Research Brief")
        self.assertEqual(next_index, 4)

    def test_malformed_h4_missing_close_tag(self) -> None:
        lines = [
            '<h4 id="broken-recipe">',
            '  <img src="https://shieldcn.dev/badge/-2563EB.svg" alt="Broken Recipe" title="Broken Recipe" />',
            "  Broken Recipe",
        ]
        parsed = checker.parse_recipe_heading_name(lines[0], lines, 0)
        self.assertIsNone(parsed)

    def test_malformed_h4_without_img_name_pattern(self) -> None:
        lines = [
            '<h4 id="no-img-recipe">',
            "  Plain text without icon img",
            "</h4>",
        ]
        parsed = checker.parse_recipe_heading_name(lines[0], lines, 0)
        self.assertIsNone(parsed)


class ParseRecipesHeadingIntegrationTest(unittest.TestCase):
    def test_parse_recipes_counts_html_h4_recipes(self) -> None:
        lines = _mini_prompt_library(
            _html_recipe_heading(slug="source-grounded-answer", name="Source-Grounded Answer"),
            _html_recipe_heading(slug="web-research-brief", name="Web Research Brief"),
        )
        errors: list[checker.Diagnostic] = []
        recipes = checker.parse_recipes(lines, errors)
        self.assertEqual(errors, [])
        self.assertEqual(len(recipes), 2)
        self.assertEqual([recipe.name for recipe in recipes], [
            "Source-Grounded Answer",
            "Web Research Brief",
        ])
        self.assertEqual(recipes[0].category, "Fixture Category")
        self.assertEqual(recipes[1].category, "Fixture Category")

    def test_parse_recipes_skips_malformed_h4(self) -> None:
        lines = _mini_prompt_library(
            _html_recipe_heading(slug="good-recipe", name="Good Recipe"),
            [
                '<h4 id="broken-recipe">',
                '  <img src="https://shieldcn.dev/badge/-2563EB.svg" alt="Broken Recipe" title="Broken Recipe" />',
                "  Broken Recipe",
            ],
        )
        errors: list[checker.Diagnostic] = []
        recipes = checker.parse_recipes(lines, errors)
        self.assertEqual(errors, [])
        self.assertEqual(len(recipes), 1)
        self.assertEqual(recipes[0].name, "Good Recipe")


if __name__ == "__main__":
    unittest.main()
