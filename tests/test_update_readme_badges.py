"""Unit tests for README badge generation helpers."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import update_readme_badges as badges  # noqa: E402

GOLDEN_URLS_PATH = Path(__file__).resolve().parent / "fixtures" / "badge_heading_urls.json"

LANE_CHIP_MARKER_KEYS = [section["key"] for section in badges.LANE_CHIP_SECTIONS]


def _marker_placeholder_block(start: str, end: str) -> list[str]:
    return [start, "stale placeholder", end]


def _mini_readme_template_lines() -> list[str]:
    lines: list[str] = [
        *_marker_placeholder_block(badges.START, badges.END),
        "",
        *_marker_placeholder_block(badges.SHORTCUTS_START, badges.SHORTCUTS_END),
        "",
        *_marker_placeholder_block(badges.LANES_START, badges.LANES_END),
        "",
        *_marker_placeholder_block(badges.JOB_MAP_START, badges.JOB_MAP_END),
        "",
    ]
    for key in LANE_CHIP_MARKER_KEYS:
        start = f"<!-- LANE-CHIPS:{key}:START -->"
        end = f"<!-- LANE-CHIPS:{key}:END -->"
        lines.extend([*_marker_placeholder_block(start, end), ""])
    lines.extend(
        [
            "## Prompt Library",
            "",
            "#### Source-Grounded Answer",
            "",
            "Research recipe body.",
            "",
            "#### Code Review",
            "",
            "Coding recipe body.",
            "",
            "## Pattern Notes",
            "",
            "#### Chain of Thought",
            "",
            "Pattern body.",
        ]
    )
    return lines


def _fresh_mini_readme() -> str:
    template = "\n".join(_mini_readme_template_lines()) + "\n"
    return badges.replace_badges(template)


class BuildRecipeHeadingBadgesTest(unittest.TestCase):
    def test_build_recipe_heading_badges_count(self) -> None:
        recipe_badges = badges.build_recipe_heading_badges()
        self.assertEqual(len(recipe_badges), 48)

    def test_build_recipe_heading_badges_unique_logos(self) -> None:
        recipe_badges = badges.build_recipe_heading_badges()
        logos = [badge["logo"] for badge in recipe_badges]
        self.assertEqual(len(logos), len(set(logos)))


class RecipeHeadingBadgeUrlTest(unittest.TestCase):
    def test_recipe_heading_badge_url_icon_only_shape(self) -> None:
        sample = badges.RECIPE_HEADING_BADGES[0]
        url = badges.recipe_heading_badge_url(sample)
        parsed = urlparse(url)
        query = parse_qs(parsed.query, keep_blank_values=True)

        self.assertTrue(parsed.path.endswith(f"/-{sample['color']}.svg"))
        self.assertTrue(parsed.query.endswith("label="), msg="icon-only badges use an empty label query param")
        self.assertIn("label", query)
        self.assertEqual(query["label"], [""])
        self.assertIn("logo", query)
        self.assertTrue(query["logo"][0].startswith("ri:"))

    def test_recipe_heading_badge_urls_use_ri_logos_for_all_recipes(self) -> None:
        for badge in badges.RECIPE_HEADING_BADGES:
            url = badges.recipe_heading_badge_url(badge)
            query = parse_qs(urlparse(url).query)
            self.assertTrue(query["logo"][0].startswith("ri:"), msg=badge["name"])


class RenderRecipeHeadingTest(unittest.TestCase):
    def test_render_recipe_heading_html_contract(self) -> None:
        badge = next(item for item in badges.RECIPE_HEADING_BADGES if item["name"] == "Source-Grounded Answer")
        rendered = badges.render_recipe_heading(badge)
        expected_src = badges.recipe_heading_badge_url(badge)

        self.assertIn(f'<h4 id="{badge["slug"]}">', rendered)
        self.assertIn(f'title="{badge["name"]}"', rendered)
        self.assertIn(f'alt="{badge["name"]}"', rendered)
        self.assertIn(f'src="{expected_src}"', rendered)
        self.assertIn('loading="lazy"', rendered)
        self.assertIn(badge["name"], rendered)
        self.assertNotIn(f"{badge['name']}-{badge['color']}.svg", rendered)


class RenderJobMapBlockTest(unittest.TestCase):
    def test_render_job_map_block_uses_html_recipe_links(self) -> None:
        block = badges.render_job_map_block()
        self.assertIn('<a href="#source-grounded-answer">Source-Grounded Answer</a>', block)
        self.assertNotIn("[Source-Grounded Answer](#source-grounded-answer)", block)


class DynamicGithubBadgeLinksTest(unittest.TestCase):
    def test_stars_badge_links_to_public_repo_tab(self) -> None:
        stars_badge = next(badge for badge in badges.DYNAMIC_GITHUB_BADGES if badge["endpoint"] == "stars")

        self.assertEqual(stars_badge["href"], "https://github.com/{owner}/{repo}?tab=stars")
        self.assertNotIn("/stargazers", stars_badge["href"])


class ApplyRecipeHeadingBadgesTest(unittest.TestCase):
    def test_apply_recipe_heading_badges_from_markdown_h4(self) -> None:
        markdown = "\n".join(
            [
                "## Prompt Library",
                "",
                "#### Source-Grounded Answer",
                "",
                "Body.",
                "",
                "## Pattern Notes",
            ]
        ) + "\n"
        updated = badges.apply_recipe_heading_badges(markdown)
        expected = badges.render_recipe_heading(
            next(item for item in badges.RECIPE_HEADING_BADGES if item["name"] == "Source-Grounded Answer")
        )

        self.assertNotIn("#### Source-Grounded Answer", updated)
        self.assertIn(expected, updated)

    def test_apply_recipe_heading_badges_idempotent(self) -> None:
        markdown = "\n".join(
            [
                "## Prompt Library",
                "",
                "#### Code Review",
                "",
                "Body.",
                "",
                "## Pattern Notes",
            ]
        ) + "\n"
        once = badges.apply_recipe_heading_badges(markdown)
        twice = badges.apply_recipe_heading_badges(once)
        self.assertEqual(once, twice)


class ReplaceBadgesCheckTest(unittest.TestCase):
    def test_replace_badges_fresh_content_is_idempotent(self) -> None:
        fresh = _fresh_mini_readme()
        self.assertEqual(fresh, badges.replace_badges(fresh))

    def test_check_mode_passes_on_fresh_mini_readme(self) -> None:
        fresh = _fresh_mini_readme()
        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            readme.write_text(fresh, encoding="utf-8")
            argv = ["update_readme_badges.py", "--readme", str(readme), "--check"]
            with patch.object(sys, "argv", argv):
                self.assertEqual(badges.main(), 0)

    def test_check_mode_fails_on_stale_badge_block(self) -> None:
        fresh = _fresh_mini_readme()
        stale = fresh.replace("shieldcn.dev/badge/", "shieldcn.dev/stale/", 1)
        self.assertNotEqual(stale, badges.replace_badges(stale))

        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            readme.write_text(stale, encoding="utf-8")
            argv = ["update_readme_badges.py", "--readme", str(readme), "--check"]
            with patch.object(sys, "argv", argv):
                self.assertEqual(badges.main(), 1)


class GoldenHeadingUrlFixtureTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.golden_urls = json.loads(GOLDEN_URLS_PATH.read_text(encoding="utf-8"))

    def test_golden_heading_urls_match_generated_urls(self) -> None:
        by_name = {badge["name"]: badge for badge in badges.RECIPE_HEADING_BADGES}
        self.assertEqual(set(self.golden_urls), {"Source-Grounded Answer", "Code Review", "JSON Extractor"})

        for name, expected_url in self.golden_urls.items():
            generated = badges.recipe_heading_badge_url(by_name[name])
            self.assertEqual(generated, expected_url, msg=name)


if __name__ == "__main__":
    unittest.main()
