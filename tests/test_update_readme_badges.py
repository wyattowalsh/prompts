"""Unit tests for catalog-owned README badge generation."""

from __future__ import annotations

import json
import os
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


def _catalog_data() -> dict[str, object]:
    return badges.load_catalog_badge_data()


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
    for lane in _catalog_data()["lanes"]:
        start = f"<!-- LANE-CHIPS:{lane['key']}:START -->"
        end = f"<!-- LANE-CHIPS:{lane['key']}:END -->"
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
    return badges.replace_badges(template, _catalog_data())


class NodeExecutableTest(unittest.TestCase):
    def test_node_executable_ignores_pnpm_masquerading_as_node(self) -> None:
        with patch.dict(os.environ, {"NODE": "/Users/ww/.local/share/mise/installs/pnpm/11.21.0/pnpm"}):
            self.assertEqual(badges.node_executable(), "node")

    def test_node_executable_keeps_an_explicit_node_binary(self) -> None:
        with patch.dict(os.environ, {"NODE": "/opt/homebrew/bin/node"}):
            self.assertEqual(badges.node_executable(), "/opt/homebrew/bin/node")

    def test_node_executable_defaults_to_node(self) -> None:
        env = {key: value for key, value in os.environ.items() if key != "NODE"}
        with patch.dict(os.environ, env, clear=True):
            self.assertEqual(badges.node_executable(), "node")


class CatalogBadgeDataTest(unittest.TestCase):
    def test_catalog_owns_all_recipe_heading_metadata(self) -> None:
        recipes = badges.catalog_recipes(_catalog_data())
        self.assertEqual(len(recipes), 48)
        self.assertEqual(len({recipe["badge"]["logo"] for recipe in recipes}), 48)
        self.assertNotIn("RECIPE_HEADING_BADGE_OVERRIDES", vars(badges))
        self.assertNotIn("LANE_CHIP_SECTIONS", vars(badges))
        self.assertNotIn("JOB_MAP_ROWS", vars(badges))

    def test_catalog_owns_featured_chips_shortcuts_and_job_map(self) -> None:
        data = _catalog_data()
        self.assertEqual(len(data["lanes"]), 8)
        self.assertTrue(all(len(lane["featured_recipes"]) == 4 for lane in data["lanes"]))
        self.assertEqual(len(data["shortcuts"]), 6)
        self.assertEqual(sum(len(lane["recipes"]) for lane in data["lanes"]), 48)


class RecipeHeadingBadgeUrlTest(unittest.TestCase):
    def test_recipe_heading_badge_url_icon_only_shape(self) -> None:
        sample = badges.catalog_recipes(_catalog_data())[0]
        url = badges.recipe_heading_badge_url(sample)
        parsed = urlparse(url)
        query = parse_qs(parsed.query, keep_blank_values=True)

        self.assertTrue(parsed.path.endswith(f"/-{sample['badge']['color']}.svg"))
        self.assertTrue(parsed.query.endswith("label="), msg="icon-only badges use an empty label query param")
        self.assertEqual(query["label"], [""])
        self.assertTrue(query["logo"][0].startswith("ri:"))

    def test_recipe_heading_badge_urls_use_ri_logos_for_all_recipes(self) -> None:
        for recipe in badges.catalog_recipes(_catalog_data()):
            query = parse_qs(urlparse(badges.recipe_heading_badge_url(recipe)).query)
            self.assertTrue(query["logo"][0].startswith("ri:"), msg=recipe["title"])


class RenderRecipeHeadingTest(unittest.TestCase):
    def test_render_recipe_heading_html_contract(self) -> None:
        recipe = next(
            item
            for item in badges.catalog_recipes(_catalog_data())
            if item["title"] == "Source-Grounded Answer"
        )
        rendered = badges.render_recipe_heading(recipe)
        expected_src = badges.recipe_heading_badge_url(recipe)

        self.assertIn(f'<h4 id="{recipe["slug"]}">', rendered)
        self.assertIn(f'title="{recipe["title"]}"', rendered)
        self.assertIn('alt=""', rendered)
        self.assertIn('width="28"', rendered)
        self.assertIn('height="28"', rendered)
        self.assertIn(f'src="{expected_src}"', rendered)
        self.assertIn('loading="lazy"', rendered)
        self.assertIn(recipe["title"], rendered)


class RenderCatalogSurfacesTest(unittest.TestCase):
    def test_render_job_map_block_uses_catalog_recipe_links(self) -> None:
        block = badges.render_job_map_block(_catalog_data())
        self.assertIn('<a href="#source-grounded-answer">Source-Grounded Answer</a>', block)
        self.assertNotIn("[Source-Grounded Answer](#source-grounded-answer)", block)

    def test_lane_chip_uses_catalog_recipe_badge_metadata(self) -> None:
        research = _catalog_data()["lanes"][0]
        block = badges.render_lane_chip_block(research)
        recipe = research["featured_recipes"][0]
        self.assertIn(recipe["badge"]["chip_label"], block)
        self.assertIn(recipe["badge"]["color"], block)
        self.assertIn(recipe["badge"]["logo"], block)


class RepositoryIdentityTest(unittest.TestCase):
    def test_schema_accepted_variants_normalize_consistently(self) -> None:
        self.assertEqual(
            badges.repo_slug("https://GitHub.com/Canonical/Project/"),
            ("Canonical", "Project"),
        )
        self.assertEqual(
            badges.repo_slug("https://github.com/canonical/project.git"),
            ("canonical", "project"),
        )

    def test_repository_identity_fails_closed_for_unsafe_variants(self) -> None:
        for url in (
            "HTTPS://github.com/canonical/project",
            "https://user:password@github.com/canonical/project",
            "https://example.test/canonical/project",
            "https://github.com/canonical/project/issues",
            "https://github.com:443/canonical/project",
            "https://github.com/canonical/project//",
        ):
            with self.subTest(url=url), self.assertRaisesRegex(
                SystemExit, "credential-free canonical HTTPS GitHub repository URL"
            ):
                badges.repo_slug(url)


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
        updated = badges.apply_recipe_heading_badges(markdown, _catalog_data())
        recipe = next(
            item
            for item in badges.catalog_recipes(_catalog_data())
            if item["title"] == "Source-Grounded Answer"
        )
        self.assertNotIn("#### Source-Grounded Answer", updated)
        self.assertIn(badges.render_recipe_heading(recipe), updated)

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
        once = badges.apply_recipe_heading_badges(markdown, _catalog_data())
        twice = badges.apply_recipe_heading_badges(once, _catalog_data())
        self.assertEqual(once, twice)


class ReplaceBadgesCheckTest(unittest.TestCase):
    def test_replace_badges_fresh_content_is_idempotent(self) -> None:
        fresh = _fresh_mini_readme()
        self.assertEqual(fresh, badges.replace_badges(fresh, _catalog_data()))

    def test_check_mode_passes_on_fresh_mini_readme(self) -> None:
        fresh = _fresh_mini_readme()
        with tempfile.TemporaryDirectory() as tmp:
            readme = Path(tmp) / "README.md"
            catalog_data = Path(tmp) / "catalog-data.json"
            readme.write_text(fresh, encoding="utf-8")
            catalog_data.write_text(json.dumps(_catalog_data()), encoding="utf-8")
            argv = [
                "update_readme_badges.py",
                "--readme",
                str(readme),
                "--catalog-data",
                str(catalog_data),
                "--check",
            ]
            with patch.object(sys, "argv", argv):
                self.assertEqual(badges.main(), 0)

    def test_check_mode_fails_on_stale_badge_block(self) -> None:
        fresh = _fresh_mini_readme()
        stale = fresh.replace("shieldcn.dev/badge/", "shieldcn.dev/stale/", 1)
        self.assertNotEqual(stale, badges.replace_badges(stale, _catalog_data()))


class GoldenHeadingUrlFixtureTest(unittest.TestCase):
    def test_golden_heading_urls_match_catalog_generated_urls(self) -> None:
        golden_urls = json.loads(GOLDEN_URLS_PATH.read_text(encoding="utf-8"))
        by_name = {recipe["title"]: recipe for recipe in badges.catalog_recipes(_catalog_data())}
        self.assertEqual(set(golden_urls), {"Source-Grounded Answer", "Code Review", "JSON Extractor"})

        for name, expected_url in golden_urls.items():
            self.assertEqual(
                badges.recipe_heading_badge_url(by_name[name]),
                expected_url,
                msg=name,
            )


if __name__ == "__main__":
    unittest.main()
