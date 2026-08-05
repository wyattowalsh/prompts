# Artifact policy — catalog-ultradeep-research-enrich

## KEEP (ship)

### Product
- Catalog YAML upgrades (material only)
- sources.yaml, source-refresh.md
- Generated README.md, web/src/data/catalog.json
- Optional goal tests under tests/ if added

### Provenance
- goal.md, facts.md, facts.meta.json, plan.md, grill-notes.md
- research/ tracks, extracts (summaries), claim-card-map, residual-gaps, ledgers, summary
- research/rubrics.md, subagent-prompts.md, residual-seed, seed-track-map

## DROP
- Plannotator session JSON (interview/facts/plan-gate results)
- research/raw/ and research/raw-rvfix/ bulk HTML/PDF dumps
- Optional huge task-graph.json at final ship discretion

## FOREIGN (never stage with this goal)
- Unrelated web/** redesign, DESIGN.md chrome, pnpm-lock churn from other goals
