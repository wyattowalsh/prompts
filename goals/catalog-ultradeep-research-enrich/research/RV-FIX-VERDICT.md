# RV-FIX-VERDICT — RV-001..005 (2026-08-01)

## Verdict: PASS

All five session-review findings closed for the ultradeep method-deep ship set.

| Finding | Status | Evidence |
| --- | --- | --- |
| RV-001 dump-churn / unreviewable YAML | PASS | `git checkout HEAD --` 26 cards, then catalog-core `emitPatternYaml`/`emitRecipeYaml` re-apply; no PyYAML `yaml.dump` |
| RV-002 reviewability / surgical diffs | PASS | 26 files, +108/-21; dump-churn-scanner `DUMP_CHURN_PASS hits=0` |
| RV-003 control_evidence_note regression | PASS | Six allowlist notes one-sentence; non-allowlist in apply set keep `null`; `check_readme_recipes.py --check` pass |
| RV-004 thin MM/PA/RAG tracks | PASS | Tracks rewritten with ≥3 findings + official extracts (2026-08-01) |
| RV-005 agents URL mismatch | PASS | Cards cite `developers.openai.com/.../agents/guardrails-approvals`; platform path retired in extracts |

## Gates

- `pnpm catalog:validate` — ok (48/43)
- `pnpm catalog:readme` — ok
- `pnpm catalog:site-data` — ok
- `python3 scripts/check_readme_recipes.py --check` — pass
- `python3 scripts/check_sources_manifest.py --check` — pass (119)
- `python3 scripts/update_readme_badges.py --check` — pass
- `python3 -m unittest tests.test_catalog_ultradeep_research_enrich_2026_07_31` — pass
- dump-churn-scanner — pass

## Stage allowlist (ship with this wave)

See `goals/catalog-ultradeep-research-enrich/research/stage-allowlist.txt`.

**Do not stage:** foreign `web/**` UI work, `DESIGN.md` (unrelated), other goals' scratch logs, unrelated `playwright`/`theme` churn.

## Residual

Documented in `research/residual-gaps.md` (not forced 91-card rewrite; no new cards).
