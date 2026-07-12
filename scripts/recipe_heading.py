"""Shared recipe heading parse helpers for checker and badge scripts."""

from __future__ import annotations

import re

RECIPE_H4_OPEN_RE = re.compile(r'^<h4 id="([^"]+)">\s*$')
RECIPE_H4_NAME_RE = re.compile(r"<img[^>]*>\s*(.+?)\s*</h4>", re.DOTALL)


def github_anchor(title: str, used: dict[str, int] | None = None) -> str:
    """GitHub-style heading anchor (same algorithm as the README checker)."""
    if used is None:
        used = {}
    anchor = title.strip().lower()
    anchor = re.sub(r"[^\w\s-]", "", anchor)
    anchor = re.sub(r"\s+", "-", anchor)
    base = anchor
    seen = used.get(base, 0)
    used[base] = seen + 1
    if seen:
        return f"{base}-{seen}"
    return base


def _is_heading_boundary(line: str) -> bool:
    return (
        line.startswith("#### ")
        or bool(RECIPE_H4_OPEN_RE.match(line))
        or line.startswith("### ")
        or line.startswith("## ")
    )


def parse_recipe_heading(
    line: str, lines: list[str], index: int
) -> tuple[str, int, str | None] | None:
    """Parse a recipe heading.

    Returns ``(name, next_index, slug_or_none)`` or ``None`` if not a heading open.

    For HTML ``<h4>`` blocks, the close tag must appear before the next heading
    open (``####``, ``<h4``, ``###``, ``##``). Otherwise the heading is treated
    as malformed (``None``) so callers can emit ``MALFORMED_RECIPE_HEADING``
    without swallowing the following recipe.
    """
    if line.startswith("#### "):
        return line[5:].strip(), index + 1, None

    open_match = RECIPE_H4_OPEN_RE.match(line)
    if not open_match:
        return None

    slug = open_match.group(1)
    block_end = index
    while block_end < len(lines):
        if block_end > index and _is_heading_boundary(lines[block_end]):
            # Hit next heading without a close tag belonging to this block.
            return None
        if "</h4>" in lines[block_end]:
            break
        block_end += 1
    else:
        return None

    block = "\n".join(lines[index : block_end + 1])
    name_match = RECIPE_H4_NAME_RE.search(block)
    if not name_match:
        return None
    name = re.sub(r"<[^>]+>", "", name_match.group(1)).strip()
    if not name:
        return None
    return name, block_end + 1, slug


def skip_malformed_h4_block(lines: list[str], start: int, section_end: int) -> int:
    """Advance past a broken ``<h4>`` open without consuming the next recipe."""
    index = start + 1
    while index < section_end:
        line = lines[index]
        if "</h4>" in line:
            return index + 1
        if _is_heading_boundary(line):
            return index
        index += 1
    return section_end


def is_recipe_heading_open(line: str) -> bool:
    return line.startswith("#### ") or bool(RECIPE_H4_OPEN_RE.match(line))
