#!/usr/bin/env python3
"""Generate the README ShieldCN badge rail.

The README is the public surface, but the badge values should not be hand
maintained. This script counts prompt recipes and pattern notes from headings,
then rewrites only the badge marker block.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote, urlencode


DEFAULT_REPO = ("wyattowalsh", "prompts")
START = "<!-- BADGES:START -->"
END = "<!-- BADGES:END -->"

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
        "label": "Prompts",
        "value": "{prompt_count}",
        "color": "8CA1AF",
        "logo": "readthedocs",
        "logoColor": "8CA1AF",
        "valueColor": "020617",
        "href": "#prompt-library",
        "alt": "Prompt library: {prompt_count} prompts",
    },
    {
        "label": "Patterns",
        "value": "{pattern_count}",
        "color": "BBDDE5",
        "logo": "gitbook",
        "logoColor": "BBDDE5",
        "valueColor": "020617",
        "href": "#pattern-notes",
        "alt": "Pattern notes: {pattern_count} techniques",
    },
    {
        "label": "Zero Shot",
        "value": "first",
        "color": "334155",
        "logo": "ri:sparkling-2-line",
        "href": "#how-to-adapt-prompts",
        "alt": "Zero-shot first: examples optional",
    },
    {
        "label": "Evidence",
        "value": "sources",
        "color": "B31B1B",
        "logo": "arxiv",
        "logoColor": "B31B1B",
        "href": "#bibliography",
        "alt": "Evidence base: papers and docs",
    },
    {
        "label": "Safety",
        "value": "eval gated",
        "color": "111111",
        "logo": "owasp",
        "href": "#safety-evals-and-trust-boundaries",
        "alt": "Safety and evals: gated",
    },
    {
        "label": "Benchmarks",
        "value": "Artificial Analysis",
        "color": "111827",
        "logo": "ri:bar-chart-box-line",
        "href": "https://artificialanalysis.ai/",
        "alt": "Benchmark context: Artificial Analysis",
    },
]

PROVIDER_BADGES = [
    {
        "label": "OpenAI",
        "value": "docs",
        "color": "412991",
        "logo": "openai",
        "href": "https://developers.openai.com/api/docs/guides/prompt-guidance",
        "alt": "OpenAI documentation",
    },
    {
        "label": "Claude",
        "value": "docs",
        "color": "D97757",
        "logo": "anthropic",
        "logoColor": "D97757",
        "href": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
        "alt": "Claude documentation",
    },
    {
        "label": "Gemini",
        "value": "docs",
        "color": "8E75B2",
        "logo": "googlegemini",
        "logoColor": "8E75B2",
        "href": "https://ai.google.dev/gemini-api/docs/prompting-strategies",
        "alt": "Gemini documentation",
    },
    {
        "label": "Perplexity",
        "value": "docs",
        "color": "1FB8CD",
        "logo": "perplexity",
        "logoColor": "1FB8CD",
        "href": "https://docs.perplexity.ai/docs/getting-started/overview",
        "alt": "Perplexity documentation",
    },
    {
        "label": "Grok",
        "value": "docs",
        "color": "111111",
        "logo": "x",
        "href": "https://docs.x.ai/overview",
        "alt": "Grok documentation",
    },
]

# CI, commit-count, and contributors endpoints render as SVGs, but the README
# keeps repo-status badges compact: recency, issues, PRs, stars, and forks.
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
        "href": "https://github.com/{owner}/{repo}/stargazers",
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


def repo_slug() -> tuple[str, str]:
    try:
        remote = subprocess.check_output(
            ["git", "remote", "get-url", "origin"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return DEFAULT_REPO

    match = re.search(r"github\.com[:/](?P<owner>[^/]+)/(?P<repo>[^/.]+)(?:\.git)?$", remote)
    if not match:
        return DEFAULT_REPO
    return match.group("owner"), match.group("repo")


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
        if in_section and line.startswith("#### "):
            count += 1
    return count


def static_badge_url(badge: dict[str, str], counts: dict[str, int], variant: str) -> str:
    label = badge["label"].format(**counts)
    value = badge["value"].format(**counts)
    params = {
        **COMMON_STATIC_PARAMS,
        "variant": variant,
        "logo": badge["logo"],
        "logoColor": badge.get("logoColor", "f8fafc"),
    }
    if badge.get("valueColor"):
        params["valueColor"] = badge["valueColor"]
    if badge.get("animate"):
        params["animate"] = badge["animate"]
    return (
        "https://shieldcn.dev/badge/"
        f"{quote(label, safe='')}-{quote(value, safe='')}-{badge['color']}.svg?"
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


def image_link(href: str, alt: str, src: str, indent: str = "    ") -> str:
    return f'{indent}<a href="{href}"><img alt="{alt}" src="{src}"></a>'


def render_badge_block(markdown: str) -> str:
    prompt_count = count_headings(markdown, "Prompt Library")
    pattern_count = count_headings(markdown, "Pattern Notes")
    if prompt_count == 0:
        raise SystemExit("Could not count prompt recipes in README.md")
    if pattern_count == 0:
        raise SystemExit("Could not count pattern notes in README.md")

    counts = {"prompt_count": prompt_count, "pattern_count": pattern_count}
    owner, repo = repo_slug()
    rows: list[str] = [START]

    rows.append('<p align="center">')
    for badge in CORE_BADGES:
        src = static_badge_url(badge, counts, "outline")
        rows.append(image_link(badge["href"], badge["alt"].format(**counts), src, indent="  "))
    rows.append("</p>")
    rows.append("")

    rows.append('<p align="center">')
    for badge in PROVIDER_BADGES:
        src = static_badge_url(badge, counts, "outline")
        rows.append(image_link(badge["href"], badge["alt"], src, indent="  "))
    rows.append("</p>")
    rows.append("")

    rows.append('<p align="center">')
    for badge in DYNAMIC_GITHUB_BADGES:
        src = dynamic_badge_url(badge, owner, repo)
        href = badge["href"].format(owner=owner, repo=repo)
        rows.append(image_link(href, badge["alt"], src, indent="  "))
    rows.append("</p>")
    rows.append("")

    rows.append('<p align="center"><sub>Last research refresh: 2026-06-16</sub></p>')
    rows.append(END)
    return "\n".join(rows)


def generated_badge_urls(markdown: str) -> list[str]:
    block = render_badge_block(markdown)
    return re.findall(r'src="(https://shieldcn\.dev[^"]+)"', block)


def replace_badges(markdown: str) -> str:
    if markdown.count(START) != 1 or markdown.count(END) != 1:
        raise SystemExit("README badge markers are missing")
    block = render_badge_block(markdown)
    pattern = re.compile(f"{re.escape(START)}.*?{re.escape(END)}", re.DOTALL)
    return pattern.sub(block, markdown, count=1)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--readme", default="README.md", help="README path")
    parser.add_argument("--check", action="store_true", help="fail if badges are stale")
    parser.add_argument("--list-urls", action="store_true", help="print generated ShieldCN image URLs")
    args = parser.parse_args()

    readme = Path(args.readme)
    original = readme.read_text(encoding="utf-8")

    if args.list_urls:
        for url in generated_badge_urls(original):
            print(url)
        return 0

    updated = replace_badges(original)

    if args.check:
        if original != updated:
            print("README badge block is stale. Run scripts/update_readme_badges.py.", file=sys.stderr)
            return 1
        return 0

    if original != updated:
        readme.write_text(updated, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
