#!/usr/bin/env python3
"""Generate README ShieldCN badge surfaces from parsed catalog metadata."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from functools import lru_cache
from html import escape, unescape
from pathlib import Path
from urllib.parse import quote, urlencode, urlsplit


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG_ROOT = REPOSITORY_ROOT / "catalog"
CATALOG_BADGE_DATA_SCRIPT = REPOSITORY_ROOT / "scripts" / "catalog_badge_data.mjs"
START = "<!-- BADGES:START -->"
END = "<!-- BADGES:END -->"
SHORTCUTS_START = "<!-- SHORTCUTS:START -->"
SHORTCUTS_END = "<!-- SHORTCUTS:END -->"
LANES_START = "<!-- LANES:START -->"
LANES_END = "<!-- LANES:END -->"
JOB_MAP_START = "<!-- JOB-MAP:START -->"
JOB_MAP_END = "<!-- JOB-MAP:END -->"
_PACKAGE_MANAGER_NODE_NAMES = frozenset(
    {"pnpm", "pnpm.exe", "pnpm.cjs", "npm", "npm-cli.js", "yarn", "yarn.js", "corepack"}
)

COMMON_STATIC_PARAMS = {
    "mode": "dark",
    "font": "space-grotesk",
    "split": "true",
    "labelColor": "020617",
    "labelTextColor": "cbd5e1",
    "valueColor": "f8fafc",
    "height": "26",
    "radius": "7",
    "padX": "10",
    "iconSize": "13",
}

CORE_BADGES = [
    {
        "label": "{prompt_count} Prompts",
        "color": "14B8A6",
        "logo": "readthedocs",
        "logoColor": "5EEAD4",
        "href": "#prompt-library",
        "alt": "Prompt library: {prompt_count} prompts",
    },
    {
        "label": "{pattern_count} Patterns",
        "color": "38BDF8",
        "logo": "gitbook",
        "logoColor": "7DD3FC",
        "href": "#pattern-notes",
        "alt": "Pattern notes: {pattern_count} techniques",
    },
    {
        "label": "Zero Shot",
        "color": "818CF8",
        "logo": "ri:RiSparkling2Line",
        "logoColor": "C7D2FE",
        "href": "#how-to-adapt-prompts",
        "alt": "Zero-shot first: examples optional",
    },
    {
        "label": "Evidence",
        "color": "F43F5E",
        "logo": "arxiv",
        "logoColor": "FDA4AF",
        "href": "#bibliography",
        "alt": "Evidence base: papers and docs",
    },
    {
        "label": "Safety",
        "color": "FB923C",
        "logo": "owasp",
        "logoColor": "FED7AA",
        "href": "#safety-evals-and-trust-boundaries",
        "alt": "Safety and evals: gated",
    },
    {
        "label": "Benchmarks",
        "color": "22D3EE",
        "logo": "ri:RiBarChartBoxLine",
        "logoColor": "A5F3FC",
        "href": "https://artificialanalysis.ai/",
        "alt": "Benchmark context: Artificial Analysis",
    },
]

PROVIDER_BADGES = [
    {
        "label": "OpenAI",
        "color": "412991",
        "logo": "ri:SiOpenai",
        "href": "https://developers.openai.com/api/docs/guides/prompt-guidance",
        "alt": "OpenAI documentation",
    },
    {
        "label": "Claude",
        "color": "D97757",
        "logo": "anthropic",
        "logoColor": "D97757",
        "href": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
        "alt": "Claude documentation",
    },
    {
        "label": "Gemini",
        "color": "8E75B2",
        "logo": "googlegemini",
        "logoColor": "8E75B2",
        "href": "https://ai.google.dev/gemini-api/docs/prompting-strategies",
        "alt": "Gemini documentation",
    },
    {
        "label": "Perplexity",
        "color": "1FB8CD",
        "logo": "perplexity",
        "logoColor": "1FB8CD",
        "href": "https://docs.perplexity.ai/docs/getting-started/overview",
        "alt": "Perplexity documentation",
    },
    {
        "label": "Grok",
        "color": "A78BFA",
        "logo": "x",
        "logoColor": "DDD6FE",
        "href": "https://docs.x.ai/overview",
        "alt": "Grok documentation",
    },
]

DYNAMIC_GITHUB_BADGES = [
    {
        "endpoint": "last-commit",
        "href": "https://github.com/{owner}/{repo}/commits/main",
        "alt": "GitHub last commit",
        "params": {"logo": "github"},
    },
    {
        "endpoint": "issues",
        "href": "https://github.com/{owner}/{repo}/issues",
        "alt": "GitHub open issues",
        "params": {"logo": "github"},
    },
    {
        "endpoint": "open-prs",
        "href": "https://github.com/{owner}/{repo}/pulls",
        "alt": "GitHub open pull requests",
        "params": {"logo": "github"},
    },
    {
        "endpoint": "stars",
        "href": "https://github.com/{owner}/{repo}?tab=stars",
        "alt": "GitHub stars",
        "params": {"logo": "github"},
    },
    {
        "endpoint": "forks",
        "href": "https://github.com/{owner}/{repo}/forks",
        "alt": "GitHub forks",
        "params": {"logo": "github"},
    },
]

LANE_BADGE_PARAMS = {
    **COMMON_STATIC_PARAMS,
    "split": "false",
    "height": "22",
    "padX": "8",
    "iconSize": "12",
}

LANE_CHIP_PARAMS = {
    **COMMON_STATIC_PARAMS,
    "split": "false",
    "height": "20",
    "padX": "7",
    "iconSize": "11",
}

RECIPE_HEADING_PARAMS = {
    **COMMON_STATIC_PARAMS,
    "split": "false",
    "height": "28",
    "padX": "6",
    "iconSize": "16",
}

NAV_BADGES = [
    {
        "label": "TOC",
        "color": "6366F1",
        "logo": "ri:RiListCheck",
        "alt": "Table of contents",
    },
    {
        "label": "Top",
        "color": "10B981",
        "logo": "ri:RiArrowUpLine",
        "alt": "Back to top",
    },
]


def node_executable() -> str:
    """Return a Node binary. Ignore NODE when a package manager overwrites it.

    `pnpm run` under mise sets NODE (and npm_node_execpath) to the pnpm binary.
    Spawning catalog_badge_data.mjs with that value fails with EACCES.
    """

    candidate = os.environ.get("NODE", "").strip()
    if candidate:
        name = Path(candidate).name.lower()
        if name not in _PACKAGE_MANAGER_NODE_NAMES and "pnpm" not in name:
            return candidate
    return "node"


@lru_cache(maxsize=8)
def load_catalog_badge_data(catalog_root: Path = DEFAULT_CATALOG_ROOT) -> dict[str, object]:
    """Load normalized badge data through the Node catalog parser and validator."""

    root = Path(catalog_root).resolve()
    command = node_executable()
    result = subprocess.run(
        [command, str(CATALOG_BADGE_DATA_SCRIPT), "--root", str(root)],
        cwd=REPOSITORY_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise SystemExit(
            f"Could not load parsed catalog badge data from {root}"
            f"{f': {detail}' if detail else ''}"
        )
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise SystemExit(f"Catalog badge data was not valid JSON: {error}") from error
    if not isinstance(data, dict):
        raise SystemExit("Catalog badge data must be a JSON object")
    return data


def repo_slug(repository_url: str) -> tuple[str, str]:
    """Normalize the schema-validated canonical GitHub repository URL."""

    try:
        parsed = urlsplit(repository_url)
        port = parsed.port
    except ValueError as error:
        raise SystemExit(
            "catalog meta.repository_url must be a credential-free canonical HTTPS GitHub repository URL"
        ) from error
    path_match = re.fullmatch(
        r"/(?P<owner>[A-Za-z0-9_.-]+)/(?P<repo>[A-Za-z0-9_.-]+?)(?:\.git)?/?",
        parsed.path,
    )
    if (
        not repository_url.startswith("https://")
        or parsed.scheme != "https"
        or (parsed.hostname or "").lower() != "github.com"
        or port is not None
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or path_match is None
    ):
        raise SystemExit(
            "catalog meta.repository_url must be a credential-free canonical HTTPS GitHub repository URL"
        )
    return path_match.group("owner"), path_match.group("repo")


def is_recipe_heading_open(line: str) -> bool:
    return line.startswith("#### ") or line.startswith('<h4 id="')


def count_headings(markdown: str, section: str) -> int:
    in_section = False
    in_fence = False
    count = 0
    for line in markdown.splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if line == f"## {section}":
            in_section = True
            continue
        if in_section and line.startswith("## "):
            break
        if in_section and is_recipe_heading_open(line):
            count += 1
    return count


def catalog_recipes(catalog_data: dict[str, object]) -> list[dict[str, object]]:
    recipes: list[dict[str, object]] = []
    for lane in catalog_data["lanes"]:
        recipes.extend(lane["recipes"])
    logos = [recipe["badge"]["logo"] for recipe in recipes]
    duplicates = sorted({logo for logo in logos if logos.count(logo) > 1})
    if duplicates:
        raise SystemExit(
            f"Recipe heading badge icons must be unique; duplicates: {', '.join(duplicates)}"
        )
    return recipes


# Named fills 67E8F9 / EAB308 are YAML identity. Live split=false SVGs paint
# labelColor 020617 + logoColor f8fafc (jewel ≠ fill; T016/T024). Do not invert
# ink to 020617 on those names — that would be dark-on-dark.
PALE_NAMED_FILLS = frozenset({"67E8F9", "EAB308"})


def heading_logo_color(fill: str) -> str:
    if str(fill).upper() in PALE_NAMED_FILLS:
        return "f8fafc"
    return "f8fafc"


def recipe_heading_badge_url(recipe: dict[str, object]) -> str:
    badge = recipe["badge"]
    params = {
        **RECIPE_HEADING_PARAMS,
        "variant": "default",
        "logo": badge["logo"],
        "logoColor": heading_logo_color(str(badge["color"])),
        "label": "",
    }
    return (
        "https://shieldcn.dev/badge/"
        f"-{badge['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def render_recipe_heading(recipe: dict[str, object]) -> str:
    src = recipe_heading_badge_url(recipe)
    name = escape(str(recipe["title"]), quote=True)
    slug = escape(str(recipe["slug"]), quote=True)
    return (
        f'<h4 id="{slug}">\n'
        f'  <img src="{src}" alt="" title="{name}" height="28" width="28" '
        f'loading="lazy" decoding="async" '
        f'style="vertical-align:text-bottom;margin-right:0.35em;" />\n'
        f"  {name}\n"
        f"</h4>"
    )


def apply_recipe_heading_badges(markdown: str, catalog_data: dict[str, object]) -> str:
    badges_by_name = {recipe["title"]: recipe for recipe in catalog_recipes(catalog_data)}
    lines = markdown.splitlines()
    in_prompt_library = False
    in_fence = False
    updated: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if line.startswith("```"):
            in_fence = not in_fence
            updated.append(line)
            index += 1
            continue
        if not in_fence and line == "## Prompt Library":
            in_prompt_library = True
            updated.append(line)
            index += 1
            continue
        if in_prompt_library and not in_fence and line.startswith("## "):
            in_prompt_library = False
        if in_prompt_library and not in_fence:
            if line.startswith("#### "):
                name = line[5:].strip()
                recipe = badges_by_name.get(name)
                if recipe is None:
                    raise SystemExit(f"Missing catalog recipe badge metadata for {name!r}")
                updated.extend(render_recipe_heading(recipe).splitlines())
                index += 1
                continue
            if line.startswith('<h4 id="'):
                block_end = index
                while block_end < len(lines) and "</h4>" not in lines[block_end]:
                    block_end += 1
                if block_end >= len(lines):
                    raise SystemExit(f"Unclosed recipe heading near line {index + 1}")
                block = "\n".join(lines[index : block_end + 1])
                slug_match = re.search(r'<h4 id="([^"]+)">', block)
                name_match = re.search(r"<img[^>]*>\s*(.+?)\s*</h4>", block, re.DOTALL)
                if not slug_match or not name_match:
                    raise SystemExit(f"Malformed recipe heading near line {index + 1}")
                name = unescape(re.sub(r"<[^>]+>", "", name_match.group(1))).strip()
                recipe = badges_by_name.get(name)
                if recipe is None:
                    raise SystemExit(f"Missing catalog recipe badge metadata for {name!r}")
                if slug_match.group(1) != recipe["slug"]:
                    raise SystemExit(f"Recipe heading slug mismatch for {name!r}")
                updated.extend(render_recipe_heading(recipe).splitlines())
                index = block_end + 1
                continue
        updated.append(line)
        index += 1
    return "\n".join(updated) + ("\n" if markdown.endswith("\n") else "")


def chip_badge_url(recipe: dict[str, object]) -> str:
    badge = recipe["badge"]
    params = {
        **LANE_CHIP_PARAMS,
        "variant": "default",
        "logo": badge["logo"],
        "logoColor": heading_logo_color(str(badge["color"])),
    }
    return (
        "https://shieldcn.dev/badge/"
        f"{quote(str(badge['chip_label']), safe='')}-{badge['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def lane_badge_url(lane: dict[str, object]) -> str:
    badge = lane["badge"]
    params = {
        **LANE_BADGE_PARAMS,
        "variant": "default",
        "logo": badge["logo"],
        "logoColor": "f8fafc",
    }
    return (
        "https://shieldcn.dev/badge/"
        f"{quote(str(badge['label']), safe='')}-{lane['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def compact_static_badge_url(
    badge: dict[str, object], counts: dict[str, int], variant: str
) -> str:
    label = str(badge["label"]).format(**counts)
    params = {
        **COMMON_STATIC_PARAMS,
        "split": "false",
        "variant": variant,
        "logo": badge["logo"],
        "logoColor": badge.get("logoColor", "f8fafc"),
    }
    return (
        "https://shieldcn.dev/badge/"
        f"{quote(label, safe='')}-{badge['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def dynamic_badge_url(badge: dict[str, object], owner: str, repo: str) -> str:
    params = {
        "variant": "branded",
        "mode": "dark",
        "font": "space-grotesk",
        "split": "true",
        "height": "24",
        "radius": "7",
        "padX": "9",
        "iconSize": "13",
        "labelColor": "181717",
        "color": "181717",
        "logoColor": "fff",
        **badge["params"],
    }
    return (
        f"https://shieldcn.dev/github/{owner}/{repo}/{badge['endpoint']}.svg?"
        f"{urlencode(params)}"
    )


def nav_badge_url(badge: dict[str, str]) -> str:
    params = {
        **COMMON_STATIC_PARAMS,
        "split": "false",
        "height": "24",
        "padX": "9",
        "variant": "default",
        "logo": badge["logo"],
        "logoColor": "f8fafc",
    }
    return (
        "https://shieldcn.dev/badge/"
        f"{quote(badge['label'], safe='')}-{badge['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def image_link(href: str, alt: str, src: str, indent: str = "    ") -> str:
    return (
        f'{indent}<a href="{escape(href, quote=True)}"><img '
        f'alt="{escape(alt, quote=True)}" src="{src}"></a>'
    )


def github_heading_anchor(title: str) -> str:
    normalized = re.sub(r"[^a-z0-9 _-]", "", title.lower())
    return re.sub(r"[ _]+", "-", normalized).strip("-")


def render_badge_block(markdown: str, catalog_data: dict[str, object]) -> str:
    prompt_count = count_headings(markdown, "Prompt Library")
    pattern_count = count_headings(markdown, "Pattern Notes")
    if prompt_count == 0:
        raise SystemExit("Could not count prompt recipes in README.md")
    if pattern_count == 0:
        raise SystemExit("Could not count pattern notes in README.md")

    counts = {"prompt_count": prompt_count, "pattern_count": pattern_count}
    owner, repo = repo_slug(str(catalog_data["repository_url"]))
    rows: list[str] = [START, '<p align="center">']
    for badge in CORE_BADGES:
        src = compact_static_badge_url(badge, counts, "default")
        rows.append(image_link(badge["href"], badge["alt"].format(**counts), src, indent="  "))
    rows.extend(["</p>", "", '<p align="center">'])
    for badge in PROVIDER_BADGES:
        src = compact_static_badge_url(badge, counts, "default")
        rows.append(image_link(badge["href"], badge["alt"], src, indent="  "))
    rows.extend(["</p>", "", '<p align="center">'])
    for badge in DYNAMIC_GITHUB_BADGES:
        src = dynamic_badge_url(badge, owner, repo)
        href = badge["href"].format(owner=owner, repo=repo)
        rows.append(image_link(href, badge["alt"], src, indent="  "))
    rows.extend(["</p>", "", END])
    return "\n".join(rows)


def render_job_map_block(catalog_data: dict[str, object]) -> str:
    rows: list[str] = [
        JOB_MAP_START,
        "<table>",
        "  <tr>",
        "    <th>Job family</th>",
        "    <th>Copy these first</th>",
        "  </tr>",
    ]
    for lane in catalog_data["lanes"]:
        anchor = github_heading_anchor(str(lane["title"]))
        src = lane_badge_url(lane)
        badge_link = image_link(
            f"#{anchor}", f"{lane['title']} lane", src, indent="      "
        )
        recipe_links = " · ".join(
            f'<a href="#{escape(str(recipe["slug"]), quote=True)}">'
            f'{escape(str(recipe["title"]))}</a>'
            for recipe in lane["recipes"]
        )
        rows.extend(
            [
                "  <tr>",
                f'    <td style="background-color:#{lane["badge"]["background"]};'
                f'border-left:4px solid #{lane["color"]};vertical-align:top;width:190px">',
                f"      {badge_link.strip()}",
                "    </td>",
                f'    <td style="vertical-align:top">{recipe_links}</td>',
                "  </tr>",
            ]
        )
    rows.extend(["</table>", JOB_MAP_END])
    return "\n".join(rows)


def render_lane_chip_block(lane: dict[str, object]) -> str:
    key = lane["key"]
    start = f"<!-- LANE-CHIPS:{key}:START -->"
    end = f"<!-- LANE-CHIPS:{key}:END -->"
    rows: list[str] = [start, '<p align="left">']
    for recipe in lane["featured_recipes"]:
        rows.append(
            image_link(
                f"#{recipe['slug']}", str(recipe["title"]), chip_badge_url(recipe), indent="  "
            )
        )
    rows.extend(["</p>", end])
    return "\n".join(rows)


def replace_lane_chips(markdown: str, catalog_data: dict[str, object]) -> str:
    updated = markdown
    for lane in catalog_data["lanes"]:
        start = f"<!-- LANE-CHIPS:{lane['key']}:START -->"
        end = f"<!-- LANE-CHIPS:{lane['key']}:END -->"
        if updated.count(start) != 1 or updated.count(end) != 1:
            raise SystemExit(f"README lane chip markers are missing: {lane['key']}")
        pattern = re.compile(f"{re.escape(start)}.*?{re.escape(end)}", re.DOTALL)
        updated = pattern.sub(render_lane_chip_block(lane), updated, count=1)
    return updated


def render_lane_block(catalog_data: dict[str, object]) -> str:
    rows: list[str] = [LANES_START, '<p align="center">']
    for lane in catalog_data["lanes"]:
        anchor = github_heading_anchor(str(lane["title"]))
        rows.append(
            image_link(
                f"#{anchor}", f"{lane['title']} lane", lane_badge_url(lane), indent="  "
            )
        )
    rows.extend(["</p>", LANES_END])
    return "\n".join(rows)


def render_shortcut_block(catalog_data: dict[str, object]) -> str:
    rows: list[str] = [SHORTCUTS_START, '<p align="center">']
    for shortcut in catalog_data["shortcuts"]:
        recipe = shortcut["recipe"]
        badge = {
            "label": shortcut["label"],
            "color": recipe["badge"]["color"],
            "logo": recipe["badge"]["logo"],
        }
        rows.append(
            image_link(
                f"#{recipe['slug']}",
                f"Copy shortcut: {recipe['title']}",
                compact_static_badge_url(badge, {}, "default"),
                indent="  ",
            )
        )
    rows.extend(["</p>", SHORTCUTS_END])
    return "\n".join(rows)


def generated_badge_urls(markdown: str, catalog_data: dict[str, object]) -> list[str]:
    rendered = replace_badges(markdown, catalog_data)
    urls = re.findall(r'src="(https://shieldcn\.dev[^"]+)"', rendered)
    urls.extend(nav_badge_url(badge) for badge in NAV_BADGES)
    return list(dict.fromkeys(urls))


def replace_marker_block(markdown: str, start: str, end: str, block: str) -> str:
    if markdown.count(start) != 1 or markdown.count(end) != 1:
        raise SystemExit(f"README badge markers are missing: {start} / {end}")
    pattern = re.compile(f"{re.escape(start)}.*?{re.escape(end)}", re.DOTALL)
    return pattern.sub(block, markdown, count=1)


def replace_badges(markdown: str, catalog_data: dict[str, object]) -> str:
    updated = replace_marker_block(
        markdown, START, END, render_badge_block(markdown, catalog_data)
    )
    updated = replace_marker_block(
        updated, LANES_START, LANES_END, render_lane_block(catalog_data)
    )
    updated = replace_marker_block(
        updated, SHORTCUTS_START, SHORTCUTS_END, render_shortcut_block(catalog_data)
    )
    updated = replace_marker_block(
        updated, JOB_MAP_START, JOB_MAP_END, render_job_map_block(catalog_data)
    )
    updated = replace_lane_chips(updated, catalog_data)
    return apply_recipe_heading_badges(updated, catalog_data)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--readme", default="README.md", help="README path")
    parser.add_argument(
        "--catalog-root",
        type=Path,
        default=DEFAULT_CATALOG_ROOT,
        help="catalog package root parsed by catalog-core",
    )
    parser.add_argument(
        "--catalog-data",
        type=Path,
        help="normalized parsed catalog badge data from catalog_badge_data.mjs",
    )
    parser.add_argument("--check", action="store_true", help="fail if badges are stale")
    parser.add_argument("--list-urls", action="store_true", help="print generated ShieldCN image URLs")
    args = parser.parse_args()

    catalog_data = (
        json.loads(args.catalog_data.read_text(encoding="utf-8"))
        if args.catalog_data
        else load_catalog_badge_data(args.catalog_root)
    )
    readme = Path(args.readme)
    original = readme.read_text(encoding="utf-8")

    if args.list_urls:
        for url in generated_badge_urls(original, catalog_data):
            print(url)
        return 0

    updated = replace_badges(original, catalog_data)

    if args.check:
        if original != updated:
            print("README badge block is stale. Run pnpm catalog:readme.", file=sys.stderr)
            return 1
        return 0

    if original != updated:
        readme.write_text(updated, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
