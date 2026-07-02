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
JOB_MAP_START = "<!-- JOB-MAP:START -->"
JOB_MAP_END = "<!-- JOB-MAP:END -->"

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

RECIPE_HEADING_PARAMS = {
    **COMMON_STATIC_PARAMS,
    "split": "false",
    "height": "28",
    "padX": "6",
    "iconSize": "16",
}

RECIPE_HEADING_ICON_OVERRIDES: dict[str, str] = {
    "JSON Extractor": "ri:RiNodeTree",
}

RECIPE_HEADING_BADGE_OVERRIDES: dict[str, dict[str, str]] = {
    "Literature Scan": {"color": "1E40AF", "logo": "ri:RiBookReadLine", "lane": "research"},
    "Disagreement Map": {"color": "93C5FD", "logo": "ri:RiDivideLine", "lane": "research"},
    "Style Transfer Without Examples": {"color": "C026D3", "logo": "ri:RiPaletteLine", "lane": "writing"},
    "FAQ Generator": {"color": "A21CAF", "logo": "ri:RiQuestionnaireLine", "lane": "writing"},
    "Refactor Planner": {"color": "059669", "logo": "ri:RiFlowChart", "lane": "coding"},
    "PR Description": {"color": "34D399", "logo": "ri:RiGitPullRequestLine", "lane": "coding"},
    "Sentiment Triage": {"color": "F59E0B", "logo": "ri:RiEmotionLine", "lane": "data"},
    "Synthetic Edge Cases": {"color": "D97706", "logo": "ri:RiCornerDownRightLine", "lane": "data"},
    "Acceptance Criteria Writer": {"color": "BE185D", "logo": "ri:RiListCheck2", "lane": "product"},
    "Support Macro": {"color": "F9A8D4", "logo": "ri:RiCustomerService2Line", "lane": "product"},
    "Risk Register": {"color": "C2410C", "logo": "ri:RiAlertLine", "lane": "operations"},
    "Meeting Action Extractor": {"color": "FD7E14", "logo": "ri:RiCalendarCheckLine", "lane": "operations"},
    "Eval-Set Generator": {"color": "0E7490", "logo": "ri:RiListOrdered", "lane": "agents"},
    "Regression Judge": {"color": "155E75", "logo": "ri:RiScales2Line", "lane": "agents"},
    "Step-Back Answer": {"color": "6D28D9", "logo": "ri:RiArrowLeftUpLine", "lane": "reasoning"},
    "Panel Review": {"color": "9F7AEA", "logo": "ri:RiGroupLine", "lane": "reasoning"},
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

JOB_MAP_ROWS = [
    {
        "badge": LANE_BADGES[0],
        "row_bg": "#172554",
        "row_accent": "#3B82F6",
        "recipes": "[Source-Grounded Answer](#source-grounded-answer) · [Web Research Brief](#web-research-brief) · [Literature Scan](#literature-scan) · [Claim Checker](#claim-checker) · [Citation Matrix](#citation-matrix) · [Disagreement Map](#disagreement-map)",
    },
    {
        "badge": LANE_BADGES[1],
        "row_bg": "#3b0764",
        "row_accent": "#A855F7",
        "recipes": "[Executive Brief](#executive-brief) · [Rewrite With Constraints](#rewrite-with-constraints) · [Style Transfer Without Examples](#style-transfer-without-examples) · [Dense Summary](#dense-summary) · [FAQ Generator](#faq-generator) · [Newsletter Draft](#newsletter-draft)",
    },
    {
        "badge": LANE_BADGES[2],
        "row_bg": "#14532d",
        "row_accent": "#22C55E",
        "recipes": "[Code Review](#code-review) · [Bug RCA](#bug-rca) · [Unit Test Writer](#unit-test-writer) · [Refactor Planner](#refactor-planner) · [PR Description](#pr-description) · [API Contract Explainer](#api-contract-explainer)",
    },
    {
        "badge": LANE_BADGES[3],
        "row_bg": "#713f12",
        "row_accent": "#EAB308",
        "recipes": "[JSON Extractor](#json-extractor) · [Table Normalizer](#table-normalizer) · [Classifier](#classifier) · [NER Extractor](#ner-extractor) · [Sentiment Triage](#sentiment-triage) · [Synthetic Edge Cases](#synthetic-edge-cases)",
    },
    {
        "badge": LANE_BADGES[4],
        "row_bg": "#500724",
        "row_accent": "#EC4899",
        "recipes": "[PRD Drafter](#prd-drafter) · [User Story Splitter](#user-story-splitter) · [Acceptance Criteria Writer](#acceptance-criteria-writer) · [Launch Checklist](#launch-checklist) · [UX Review](#ux-review) · [Support Macro](#support-macro)",
    },
    {
        "badge": LANE_BADGES[5],
        "row_bg": "#431407",
        "row_accent": "#F97316",
        "recipes": "[Incident Summary](#incident-summary) · [Runbook Generator](#runbook-generator) · [Log Triage](#log-triage) · [Risk Register](#risk-register) · [Decision Memo](#decision-memo) · [Meeting Action Extractor](#meeting-action-extractor)",
    },
    {
        "badge": LANE_BADGES[6],
        "row_bg": "#164e63",
        "row_accent": "#06B6D4",
        "recipes": "[Tool-Use Planner](#tool-use-planner) · [RAG Answer Contract](#rag-answer-contract) · [Prompt-Injection Scanner](#prompt-injection-scanner) · [Eval-Set Generator](#eval-set-generator) · [Regression Judge](#regression-judge) · [Prompt Optimizer](#prompt-optimizer)",
    },
    {
        "badge": LANE_BADGES[7],
        "row_bg": "#2e1065",
        "row_accent": "#8B5CF6",
        "recipes": "[Plan-and-Solve](#plan-and-solve) · [Step-Back Answer](#step-back-answer) · [Verification Pass](#verification-pass) · [Self-Refine Pass](#self-refine-pass) · [Panel Review](#panel-review) · [Tradeoff Matrix](#tradeoff-matrix)",
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


def recipe_links_from_job_map() -> list[tuple[str, str]]:
    links: list[tuple[str, str]] = []
    for row in JOB_MAP_ROWS:
        for match in re.finditer(r"\[([^\]]+)\]\(#([^)]+)\)", row["recipes"]):
            links.append((match.group(1), match.group(2)))
    return links


def lane_chip_lookup() -> dict[str, tuple[dict[str, str], str]]:
    lookup: dict[str, tuple[dict[str, str], str]] = {}
    for section in LANE_CHIP_SECTIONS:
        lane = section["key"]
        for chip in section["chips"]:
            lookup[chip["alt"]] = (chip, lane)
    return lookup


def build_recipe_heading_badges() -> list[dict[str, str]]:
    chip_lookup = lane_chip_lookup()
    badges: list[dict[str, str]] = []
    for name, slug in recipe_links_from_job_map():
        if name in RECIPE_HEADING_BADGE_OVERRIDES:
            override = RECIPE_HEADING_BADGE_OVERRIDES[name]
            badges.append({"name": name, "slug": slug, **override})
            continue
        chip, lane = chip_lookup[name]
        logo = RECIPE_HEADING_ICON_OVERRIDES.get(name, chip["logo"])
        badges.append(
            {
                "name": name,
                "slug": slug,
                "color": chip["color"],
                "logo": logo,
                "lane": lane,
            }
        )
    if len(badges) != 48:
        raise SystemExit(f"Expected 48 recipe heading badges, found {len(badges)}")
    logos = [badge["logo"] for badge in badges]
    if len(logos) != len(set(logos)):
        duplicates = sorted({logo for logo in logos if logos.count(logo) > 1})
        raise SystemExit(f"Recipe heading badge icons must be unique; duplicates: {', '.join(duplicates)}")
    return badges


RECIPE_HEADING_BADGES = build_recipe_heading_badges()


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


def recipe_heading_badge_url(badge: dict[str, str]) -> str:
    params = {
        **RECIPE_HEADING_PARAMS,
        "variant": "default",
        "logo": badge["logo"],
        "logoColor": "f8fafc",
        "label": "",
    }
    return (
        "https://shieldcn.dev/badge/"
        f"-{badge['color']}.svg?"
        f"{urlencode(params, safe=':')}"
    )


def render_recipe_heading(badge: dict[str, str]) -> str:
    src = recipe_heading_badge_url(badge)
    name = badge["name"]
    return (
        f'<h4 id="{badge["slug"]}">\n'
        f'  <img src="{src}" alt="{name}" title="{name}" height="28" '
        f'loading="lazy" decoding="async" '
        f'style="vertical-align:text-bottom;margin-right:0.35em;" />\n'
        f'  {name}\n'
        f"</h4>"
    )


def apply_recipe_heading_badges(markdown: str) -> str:
    badges_by_name = {badge["name"]: badge for badge in RECIPE_HEADING_BADGES}
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
                badge = badges_by_name.get(name)
                if badge is None:
                    raise SystemExit(f"Missing recipe heading badge config for {name!r}")
                updated.extend(render_recipe_heading(badge).splitlines())
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
                name = re.sub(r"<[^>]+>", "", name_match.group(1)).strip()
                badge = badges_by_name.get(name)
                if badge is None:
                    raise SystemExit(f"Missing recipe heading badge config for {name!r}")
                if slug_match.group(1) != badge["slug"]:
                    raise SystemExit(f"Recipe heading slug mismatch for {name!r}")
                updated.extend(render_recipe_heading(badge).splitlines())
                index = block_end + 1
                continue
        updated.append(line)
        index += 1
    return "\n".join(updated) + ("\n" if markdown.endswith("\n") else "")


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


def format_job_map_recipe_links(recipes_md: str) -> str:
    """Render recipe links as HTML anchors for GitHub table cells."""
    links = re.findall(r"\[([^\]]+)\]\(#([^)]+)\)", recipes_md)
    if not links:
        return recipes_md
    return " · ".join(f'<a href="#{slug}">{label}</a>' for label, slug in links)


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


def render_job_map_block() -> str:
    rows: list[str] = [
        JOB_MAP_START,
        "<table>",
        "  <tr>",
        "    <th>Job family</th>",
        "    <th>Copy these first</th>",
        "  </tr>",
    ]
    for entry in JOB_MAP_ROWS:
        badge = entry["badge"]
        src = lane_badge_url(badge)
        badge_link = image_link(badge["href"], badge["alt"], src, indent="      ")
        rows.extend(
            [
                "  <tr>",
                f'    <td style="background-color:{entry["row_bg"]};border-left:4px solid {entry["row_accent"]};vertical-align:top;width:190px">',
                f"      {badge_link.strip()}",
                "    </td>",
                f'    <td style="vertical-align:top">{format_job_map_recipe_links(entry["recipes"])}</td>',
                "  </tr>",
            ]
        )
    rows.extend(["</table>", JOB_MAP_END])
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
    blocks = [render_badge_block(markdown), render_lane_block(), render_shortcut_block(), render_job_map_block()]
    blocks.extend(render_lane_chip_block(section) for section in LANE_CHIP_SECTIONS)
    blocks.extend(render_recipe_heading(badge) for badge in RECIPE_HEADING_BADGES)
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
    updated = replace_marker_block(updated, JOB_MAP_START, JOB_MAP_END, render_job_map_block())
    updated = replace_lane_chips(updated)
    return apply_recipe_heading_badges(updated)


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
