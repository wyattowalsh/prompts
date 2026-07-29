# Artifact policy — prompt-catalog-research-upgrade

## KEEP (stage / commit)

### Product (SHIP_A)
- Catalog YAML upgrades (2 recipes, 3 patterns)
- `sources.yaml`, `source-refresh.md`
- Generated `README.md`, `web/src/data/catalog.json`
- `tests/test_catalog_research_upgrade_2026_07_25.py`

### Provenance (SHIP_B)
- `goal.md`, `facts.md`, `facts.meta.json`
- Ledgers: `ledger-*.md`
- `LIVE_IDS.txt`, `stage-allowlist.txt`, `summary.md`, `fix-report.md`, `notes.md`, `plan.md`
- Hygiene: `ARTIFACT_POLICY.md`, `SHIP_*.txt`, `DROP.txt`, `path-sets.json`, `hygiene-report.md`

## DROP (do not stage)

- Plannotator session JSON: `interview-result.json`, `facts-result.json`, `facts-review.json`
- Gate noise: `plan-gate-*.json`, `plan-gate-stderr.txt`, `plan-gate-result.raw.json`
- Large setup DAG: `task-graph.json`
- Optional setup inputs: `interview.json` (ignored via gitignore pattern for results; interview.json itself may remain untracked)

## FOREIGN (leave dirty, never stage with this goal)

- All `web/**` except `web/src/data/catalog.json`
- `DESIGN.md`, `pnpm-lock.yaml`, `packages/**`

## Rationale

RV-006: prevent shipping web redesign with catalog research.
RV-007: keep durable provenance; exclude transient setup/gate artifacts.
