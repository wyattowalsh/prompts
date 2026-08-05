# Artifact policy — prompt-catalog-research-deepen

## Ship (product + durable pack)

- `catalog/patterns/*.yaml`, `catalog/recipes/*.yaml` (this-pass PE upgrades)
- `sources.yaml`, `source-refresh.md`
- Regenerated `README.md`, `web/src/data/catalog.json`, `web/src/data/catalog-meta.json`
- `goals/prompt-catalog-research-deepen/{goal,facts,plan,notes,summary,ledger-*}.md`
- `goals/prompt-catalog-research-deepen/LIVE_IDS.txt`
- `goals/prompt-catalog-research-deepen/research/**` (extracts, residual-seed, cascade-queue)
- `tests/test_catalog_research_deepen_2026_08_04.py`
- `tests/test_catalog_research_upgrade_2026_07_25.py` (successor-wave compatible)

## DROP (session noise; do not require for done)

- `interview.json`, `interview-result.json`, `facts-review.json`, `facts-result.json`
- `plan-gate-result.json`, raw gate logs
- Implementer SCRATCH under system temp (not in repo)

## Foreign (preserve dirty; never mix into this ship set)

- Unrelated `web/**` redesign WIP, `DESIGN.md` chrome, other goals’ scratch/logs
