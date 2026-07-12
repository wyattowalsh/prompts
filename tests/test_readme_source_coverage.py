"""README external citation coverage against sources.yaml."""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
SOURCE_MANIFEST = ROOT / "sources.yaml"

sys.path.insert(0, str(ROOT / "scripts"))

import check_sources_manifest  # noqa: E402

HTTPS_RE = re.compile(r"https://[^\s\)\"\'<>]+")
BADGE_HOST_SUFFIXES = (
    "shieldcn.dev",
    "img.shields.io",
    "badgen.net",
    "camo.githubusercontent.com",
)
# Repo metadata / badge targets are not bibliography sources.
REPO_META_PREFIXES = (
    "https://github.com/wyattowalsh/prompts",
    "https://github.com/wyattowalsh/prompts/",
)


def _normalize_url(raw: str) -> str:
    url = raw.rstrip(".,;:)")
    # Strip common Markdown trailing punctuation clusters.
    while url and url[-1] in ".,;:)":
        url = url[:-1]
    return url


def _is_badge_or_asset_host(netloc: str) -> bool:
    host = netloc.lower()
    return any(host == suffix or host.endswith("." + suffix) for suffix in BADGE_HOST_SUFFIXES)


def _is_repo_meta(url: str) -> bool:
    if url.rstrip("/") == "https://github.com/wyattowalsh/prompts":
        return True
    for prefix in REPO_META_PREFIXES:
        if url.startswith(prefix) and (
            url == prefix.rstrip("/")
            or url.startswith(prefix + "?")
            or any(
                url.startswith(prefix + path)
                for path in (
                    "pulls",
                    "issues",
                    "forks",
                    "commits/",
                    "actions",
                    "stargazers",
                    "network",
                    "watchers",
                )
            )
            or "tab=" in url
        ):
            return True
    return False


def extract_readme_external_urls(text: str) -> set[str]:
    found: set[str] = set()
    for match in HTTPS_RE.findall(text):
        url = _normalize_url(match)
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc:
            continue
        if _is_badge_or_asset_host(parsed.netloc):
            continue
        if _is_repo_meta(url):
            continue
        found.add(url)
    return found


def manifest_urls() -> set[str]:
    entries = check_sources_manifest.parse_manifest(SOURCE_MANIFEST)
    urls: set[str] = set()
    for entry in entries:
        url = entry.get("url", "").strip()
        if url:
            urls.add(url)
            urls.add(url.rstrip("/"))
            if not url.endswith("/"):
                urls.add(url + "/")
    return urls


class ReadmeSourceCoverageTest(unittest.TestCase):
    def test_readme_external_urls_are_in_sources_manifest(self) -> None:
        readme_urls = extract_readme_external_urls(README.read_text(encoding="utf-8"))
        sources = manifest_urls()
        missing = sorted(url for url in readme_urls if url not in sources and url.rstrip("/") not in sources)
        self.assertEqual(
            missing,
            [],
            msg=(
                "README external https URLs missing from sources.yaml "
                f"({len(missing)}):\n" + "\n".join(f"  - {url}" for url in missing)
            ),
        )

    def test_sources_manifest_has_substantial_coverage(self) -> None:
        entries = check_sources_manifest.parse_manifest(SOURCE_MANIFEST)
        self.assertGreaterEqual(len(entries), 100, msg="Expected inventory-driven sources expansion (≥100).")


if __name__ == "__main__":
    unittest.main()
