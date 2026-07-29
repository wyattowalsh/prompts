# Source deltas — prompt-catalog-research-upgrade

**As of:** 2026-07-25

## Policy (honest)

| Layer | Meaning |
| --- | --- |
| `last_checked: 2026-07-25` on all 119 rows | **Inventory-refresh** date (see `sources.yaml` header) |
| Status `live 200 · 2026-07-25` | URL actually HTTP 200 during this goal (18 ids in `LIVE_IDS.txt`) |
| Status `inventory 2026-07-25` | Inventory pass only; not a live re-check |

## Deltas

| Action | id / scope | notes |
| --- | --- | --- |
| update | all 119 `sources.yaml` entries | `last_checked` → `2026-07-25` as inventory-refresh |
| update | `source-refresh.md` | Freshness date 2026-07-25; Status grammar inventory vs live; method split |
| live re-verify (HTTP 200) | see `LIVE_IDS.txt` (18) | OpenAI/Anthropic/Gemini high-churn + OWASP + 4 arXiv abs |
| notes fix | `anthropic-build-with-claude-prompt-engineering-reduce-hallucinations` | Removed stale “verified 200 on 2026-07-12” wording (RV-005) |
| add | none | |
| remove | none | |

`python3 scripts/check_sources_manifest.py --check` → pass (119 entries).
