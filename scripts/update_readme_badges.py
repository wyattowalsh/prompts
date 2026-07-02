#!/usr/bin/env python3
"""Generate README ShieldCN badge surfaces.

The README is the public surface, but badge values should not be hand
maintained. This script counts prompt recipes and pattern notes from headings,
then rewrites the generated badge marker blocks.
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
SHORTCUTS_START = "<!-- SHORTCUTS:START -->"
SHORTCUTS_END = "<!-- SHORTCUTS:END -->"
LANES_START = "<!-- LANES:START -->"
LANES_END = "<!-- LANES:END -->"

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

SHORTCUT_BADGES = [
    {
        "label": "Sources",
        "color": "2563EB",
        "logo": "ri:RiQuoteText",
        "href": "#source-grounded-answer",
        "alt": "Copy shortcut: Source-Grounded Answer",
    },
    {
        "label": "Code Review",
        "color": "16A34A",
        "logo": "ri:RiCodeSSlashLine",
        "href": "#code-review",
        "alt": "Copy shortcut: Code Review",
    },
    {
        "label": "JSON",
        "color": "F59E0B",
        "logo": "ri:RiBracesLine",
        "href": "#json-extractor",
        "alt": "Copy shortcut: JSON Extractor",
    },
    {
        "label": "RAG",
        "color": "0EA5E9",
        "logo": "ri:RiDatabase2Line",
        "href": "#rag-answer-contract",
        "alt": "Copy shortcut: RAG Answer Contract",
    },
    {
        "label": "Panel",
        "color": "8B5CF6",
        "logo": "ri:RiTeamLine",
        "href": "#panel-review",
        "alt": "Copy shortcut: Panel Review",
    },
    {
        "label": "Optimize",
        "color": "DB2777",
        "logo": "ri:RiLoopRightLine",
        "href": "#prompt-optimizer",
        "alt": "Copy shortcut: Prompt Optimizer",
    },
]

LANE_BADGES = [
    {"label": "Research", "color": "3B82F6", "logo": "ri:RiMicroscopeLine", "href": "#research", "alt": "Research lane"},
    {"label": "Writing", "color": "A855F7", "logo": "ri:RiQuillPenLine", "href": "#writing", "alt": "Writing lane"},
    {"label": "Coding", "color": "22C55E", "logo": "ri:RiCodeBoxLine", "href": "#coding", "alt": "Coding lane"},
    {"label": "Data", "color": "EAB308", "logo": "ri:RiDatabaseLine", "href": "#data", "alt": "Data lane"},
    {"label": "Product", "color": "EC4899", "logo": "ri:RiLayoutGridLine", "href": "#product", "alt": "Product lane"},
    {"label": "Ops", "color": "F97316", "logo": "ri:RiPulseLine", "href": "#operations", "alt": "Operations lane"},
    {"label": "Agents", "color": "06B6D4", "logo": "ri:RiRobot2Line", "href": "#agent-and-tool-workflows", "alt": "Agent workflows lane"},
    {"label": "Reasoning", "color": "8B5CF6", "logo": "ri:RiBrainLine", "href": "#reasoning", "alt": "Reasoning lane"},
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

LANE_CHIP_SECTIONS = [
    {
        "key": "research",
        "chips": [
            {"label": "Grounded", "color": "2563EB", "logo": "ri:RiQuoteText", "href": "#source-grounded-answer", "alt": "Source-Grounded Answer"},
            {"label": "Web brief", "color": "3B82F6", "logo": "ri:RiGlobalLine", "href": "#web-research-brief", "alt": "Web Research Brief"},
            {"label": "Claims", "color": "60A5FA", "logo": "ri:RiShieldCheckLine", "href": "#claim-checker", "alt": "Claim Checker"},
            {"label": "Citations", "color": "1D4ED8", "logo": "ri:RiLinksLine", "href": "#citation-matrix", "alt": "Citation Matrix"},
        ],
    },
    {
        "key": "writing",
        "chips": [
            {"label": "Brief", "color": "9333EA", "logo": "ri:RiFileTextLine", "href": "#executive-brief", "alt": "Executive Brief"},
            {"label": "Rewrite", "color": "A855F7", "logo": "ri:RiEditLine", "href": "#rewrite-with-constraints", "alt": "Rewrite With Constraints"},
            {"label": "Summary", "color": "C084FC", "logo": "ri:RiAlignLeft", "href": "#dense-summary", "alt": "Dense Summary"},
            {"label": "Newsletter", "color": "D946EF", "logo": "ri:RiMailLine", "href": "#newsletter-draft", "alt": "Newsletter Draft"},
        ],
    },
    {
        "key": "coding",
        "chips": [
            {"label": "Review", "color": "16A34A", "logo": "ri:RiCodeSSlashLine", "href": "#code-review", "alt": "Code Review"},
            {"label": "RCA", "color": "22C55E", "logo": "ri:RiBugLine", "href": "#bug-rca", "alt": "Bug RCA"},
            {"label": "Tests", "color": "4ADE80", "logo": "ri:RiTestTubeLine", "href": "#unit-test-writer", "alt": "Unit Test Writer"},
            {"label": "API", "color": "10B981", "logo": "ri:RiBracesLine", "href": "#api-contract-explainer", "alt": "API Contract Explainer"},
        ],
    },
    {
        "key": "data",
        "chips": [
            {"label": "JSON", "color": "EAB308", "logo": "ri:RiBracesLine", "href": "#json-extractor", "alt": "JSON Extractor"},
            {"label": "Tables", "color": "FACC15", "logo": "ri:RiTableLine", "href": "#table-normalizer", "alt": "Table Normalizer"},
            {"label": "Classify", "color": "CA8A04", "logo": "ri:RiPriceTag3Line", "href": "#classifier", "alt": "Classifier"},
            {"label": "NER", "color": "FDE047", "logo": "ri:RiUserSearchLine", "href": "#ner-extractor", "alt": "NER Extractor"},
        ],
    },
    {
        "key": "product",
        "chips": [
            {"label": "PRD", "color": "EC4899", "logo": "ri:RiDraftLine", "href": "#prd-drafter", "alt": "PRD Drafter"},
            {"label": "Stories", "color": "F472B6", "logo": "ri:RiStickyNoteLine", "href": "#user-story-splitter", "alt": "User Story Splitter"},
            {"label": "Launch", "color": "FB7185", "logo": "ri:RiRocketLine", "href": "#launch-checklist", "alt": "Launch Checklist"},
            {"label": "UX", "color": "E879F9", "logo": "ri:RiLayoutLine", "href": "#ux-review", "alt": "UX Review"},
        ],
    },
    {
        "key": "operations",
        "chips": [
            {"label": "Incident", "color": "F97316", "logo": "ri:RiAlarmWarningLine", "href": "#incident-summary", "alt": "Incident Summary"},
            {"label": "Runbook", "color": "FB923C", "logo": "ri:RiBookOpenLine", "href": "#runbook-generator", "alt": "Runbook Generator"},
            {"label": "Logs", "color": "FDBA74", "logo": "ri:RiFileSearchLine", "href": "#log-triage", "alt": "Log Triage"},
            {"label": "Decision", "color": "EA580C", "logo": "ri:RiScalesLine", "href": "#decision-memo", "alt": "Decision Memo"},
        ],
    },
    {
        "key": "agents",
        "chips": [
            {"label": "Tools", "color": "06B6D4", "logo": "ri:RiToolsLine", "href": "#tool-use-planner", "alt": "Tool-Use Planner"},
            {"label": "RAG", "color": "0891B2", "logo": "ri:RiDatabase2Line", "href": "#rag-answer-contract", "alt": "RAG Answer Contract"},
            {"label": "Injection", "color": "22D3EE", "logo": "ri:RiShieldKeyholeLine", "href": "#prompt-injection-scanner", "alt": "Prompt-Injection Scanner"},
            {"label": "Optimize", "color": "67E8F9", "logo": "ri:RiLoopRightLine", "href": "#prompt-optimizer", "alt": "Prompt Optimizer"},
        ],
    },
    {
        "key": "reasoning",
        "chips": [
            {"label": "Plan", "color": "8B5CF6", "logo": "ri:RiRouteLine", "href": "#plan-and-solve", "alt": "Plan-and-Solve"},
            {"label": "Verify", "color": "7C3AED", "logo": "ri:RiCheckboxCircleLine", "href": "#verification-pass", "alt": "Verification Pass"},
            {"label": "Refine", "color": "A78BFA", "logo": "ri:RiRefreshLine", "href": "#self-refine-pass", "alt": "Self-Refine Pass"},
            {"label": "Tradeoffs", "color": "C4B5FD", "logo": "ri:RiScales3Line", "href": "#tradeoff-matrix", "alt": "Tradeoff Matrix"},
        ],
    },
]

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


def chip_badge_url(chip: dict[str, str]) -> str:
    params = {
        **LANE_CHIP_PARAMS,
        "variant": "default",
        "logo": chip["logo"],
        "logoColor": chip.get("logoColor", "f8fafc"),
    }
    return (
        "https://shieldcn.dev/badge/"
        f"{quote(chip['label'], safe='')}-{chip['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def lane_badge_url(badge: dict[str, str]) -> str:
    params = {
        **LANE_BADGE_PARAMS,
        "variant": "default",
        "logo": badge["logo"],
        "logoColor": "f8fafc",
    }
    return (
        "https://shieldcn.dev/badge/"
        f"{quote(badge['label'], safe='')}-{badge['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def compact_static_badge_url(badge: dict[str, str], counts: dict[str, int], variant: str) -> str:
    label = badge["label"].format(**counts)
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
        src = compact_static_badge_url(badge, counts, "default")
        rows.append(image_link(badge["href"], badge["alt"].format(**counts), src, indent="  "))
    rows.append("</p>")
    rows.append("")

    rows.append('<p align="center">')
    for badge in PROVIDER_BADGES:
        src = compact_static_badge_url(badge, counts, "default")
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
    rows.append(END)
    return "\n".join(rows)


def render_lane_chip_block(section: dict[str, object]) -> str:
    key = section["key"]
    chips = section["chips"]
    start = f"<!-- LANE-CHIPS:{key}:START -->"
    end = f"<!-- LANE-CHIPS:{key}:END -->"
    rows: list[str] = [start, '<p align="left">']
    for chip in chips:
        src = chip_badge_url(chip)
        rows.append(image_link(chip["href"], chip["alt"], src, indent="  "))
    rows.extend(["</p>", end])
    return "\n".join(rows)


def replace_lane_chips(markdown: str) -> str:
    updated = markdown
    for section in LANE_CHIP_SECTIONS:
        start = f"<!-- LANE-CHIPS:{section['key']}:START -->"
        end = f"<!-- LANE-CHIPS:{section['key']}:END -->"
        if updated.count(start) != 1 or updated.count(end) != 1:
            raise SystemExit(f"README lane chip markers are missing: {section['key']}")
        block = render_lane_chip_block(section)
        pattern = re.compile(f"{re.escape(start)}.*?{re.escape(end)}", re.DOTALL)
        updated = pattern.sub(block, updated, count=1)
    return updated


def render_lane_block() -> str:
    rows: list[str] = [LANES_START]
    rows.append('<p align="center">')
    for badge in LANE_BADGES:
        src = lane_badge_url(badge)
        rows.append(image_link(badge["href"], badge["alt"], src, indent="  "))
    rows.append("</p>")
    rows.append(LANES_END)
    return "\n".join(rows)


def render_shortcut_block() -> str:
    rows: list[str] = [SHORTCUTS_START]
    rows.append('<p align="center">')
    for badge in SHORTCUT_BADGES:
        src = compact_static_badge_url(badge, {}, "default")
        rows.append(image_link(badge["href"], badge["alt"], src, indent="  "))
    rows.append("</p>")
    rows.append(SHORTCUTS_END)
    return "\n".join(rows)


def generated_badge_urls(markdown: str) -> list[str]:
    blocks = [render_badge_block(markdown), render_lane_block(), render_shortcut_block()]
    blocks.extend(render_lane_chip_block(section) for section in LANE_CHIP_SECTIONS)
    urls = re.findall(r'src="(https://shieldcn\.dev[^"]+)"', "\n".join(blocks))
    # Nav badges are repeated in the README body, so list each unique URL once
    # for smoke checks without making the script rewrite every section footer.
    urls.extend(nav_badge_url(badge) for badge in NAV_BADGES)
    return urls


def replace_marker_block(markdown: str, start: str, end: str, block: str) -> str:
    if markdown.count(start) != 1 or markdown.count(end) != 1:
        raise SystemExit(f"README badge markers are missing: {start} / {end}")
    pattern = re.compile(f"{re.escape(start)}.*?{re.escape(end)}", re.DOTALL)
    return pattern.sub(block, markdown, count=1)


def replace_badges(markdown: str) -> str:
    updated = replace_marker_block(markdown, START, END, render_badge_block(markdown))
    updated = replace_marker_block(updated, LANES_START, LANES_END, render_lane_block())
    updated = replace_marker_block(updated, SHORTCUTS_START, SHORTCUTS_END, render_shortcut_block())
    return replace_lane_chips(updated)


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
