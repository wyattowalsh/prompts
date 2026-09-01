"""Shared catalog cardinality and prompt classification constants."""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

DEFAULT_INDEX_PATH = Path(__file__).resolve().parent.parent / "catalog" / "index.yaml"

_COUNTS_PROMPTS_RE = re.compile(r"^  prompts:\s+(\d+)\s*$")
_PROMPT_SLUGS_HEADER_RE = re.compile(r"^    prompt_slugs:\s*$")
_PROMPT_SLUG_ITEM_RE = re.compile(r"^      - ([a-z0-9]+(?:-[a-z0-9]+)*)$")

SECTION_MAP_PARENT_HEADINGS = (
    "Start Here",
    "Prompt Library",
    "How To Adapt Prompts",
    "Provider Controls",
    "Safety, Evals, And Trust Boundaries",
    "Pattern Selection Matrix",
    "Contributing Prompts",
    "Bibliography",
)

PROMPT_LIBRARY_CATEGORIES = (
    "Research",
    "Writing",
    "Coding",
    "Data",
    "Product",
    "Operations",
    "Agent and Tool Workflows",
    "Reasoning",
)

SECTION_MAP_COUNT = len(SECTION_MAP_PARENT_HEADINGS) + len(PROMPT_LIBRARY_CATEGORIES)

# High-risk job titles that historically carried a Control/evidence note.
# Generated README cards currently omit the note; checkers validate format only
# when a note is present.
CONTROL_NOTE_RECIPES = frozenset(
    {
        "Source-Grounded Answer",
        "Web Research Brief",
        "Literature Scan",
        "Claim Checker",
        "JSON Extractor",
        "Classifier",
        "Named Entity Extraction",
        "Tool-Use Planner",
        "RAG Answer Contract",
        "Prompt-Injection Scanner",
        "Eval-Set Generator",
        "Regression Judge",
        "Prompt Optimizer",
        "Simulated Panel",
    }
)

# Lane heading → trust-boundary class for STRICT copy-prompt lint.
LANE_CLASS: dict[str, str] = {
    "Research": "research",
    "Writing": "editorial",
    "Coding": "code",
    "Data": "extract",
    "Product": "product",
    "Operations": "ops",
    "Agent and Tool Workflows": "tools",
    "Reasoning": "reasoning",
}

STRICT_VALIDATION_CLASSES = frozenset({"research", "code", "tools", "ops"})

CLASS_SIGNAL_PATTERNS: dict[str, str] = {
    "research": r"evidence|citation|source|missing|ground|claim",
    "code": r"test|fail|diff|verify|bug|lint|repro|patch",
    "tools": r"permission|retriev|eval|inject|tool|optim|metric|judge|failure|side effect|approv",
    "ops": r"risk|incident|reverse|blast|rollback|approval|severity|mitigat|owner|action",
}


@lru_cache(maxsize=8)
def load_index_catalog(index_path: str) -> tuple[int, tuple[str, ...]]:
    """Return ``(counts.prompts, prompt_slugs)`` from catalog/index.yaml without PyYAML."""
    path = Path(index_path)
    slugs: list[str] = []
    count: int | None = None
    in_prompt_slugs = False
    in_counts = False
    lineno = 0
    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if raw.startswith("counts:"):
            in_counts = True
            in_prompt_slugs = False
            continue
        if in_counts:
            match = _COUNTS_PROMPTS_RE.match(raw)
            if match:
                count = int(match.group(1))
                in_counts = False
                continue
            if raw and not raw.startswith(" "):
                in_counts = False
        if _PROMPT_SLUGS_HEADER_RE.match(raw):
            in_prompt_slugs = True
            continue
        if not in_prompt_slugs:
            continue
        item = _PROMPT_SLUG_ITEM_RE.match(raw)
        if item:
            slugs.append(item.group(1))
            continue
        in_prompt_slugs = False
    if not slugs:
        raise ValueError(f"{path}:{lineno}: no prompt_slugs entries found")
    if count is None:
        count = len(slugs)
    return count, tuple(slugs)


def load_index_prompt_slugs(index_path: Path | str | None = None) -> list[str]:
    """Return lane-concatenated ``prompt_slugs`` from catalog/index.yaml."""
    path = Path(index_path) if index_path is not None else DEFAULT_INDEX_PATH
    _count, slugs = load_index_catalog(str(path))
    return list(slugs)


def load_prompt_count(index_path: Path | str | None = None) -> int:
    """Return ``counts.prompts`` from catalog/index.yaml (falls back to slug length)."""
    path = Path(index_path) if index_path is not None else DEFAULT_INDEX_PATH
    count, _slugs = load_index_catalog(str(path))
    return count


PROMPT_COUNT = load_prompt_count()
PROMPT_SLUGS = tuple(load_index_prompt_slugs())
