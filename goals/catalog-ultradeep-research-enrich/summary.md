# Summary — catalog-ultradeep-research-enrich

**Completed:** 2026-07-31  
**RV-001..005 fix closeout:** 2026-08-01

## Research pack

- 8 required tracks completed under `research/tracks/` (MM / PA / RAG deepened 2026-08-01)
- 37 content-deep extract notes under `research/extracts/` (live HTTP 200 + synthesis + RV-005 agents re-fetch)
- Claim→card map + cascade queue + residual-gaps + extract-coverage
- Residual seeds from prior wave folded into tracks

## Catalog cascade (method-deep)

**Patterns upgraded (15):** zero-shot-chain-of-thought, tree-of-thoughts, graph-of-thoughts, algorithm-of-thoughts, self-refine, chain-of-verification, evaluation-flywheel, eval-driven-prompt-optimization, expert-panel-discussion, panelgpt, context-engineering, multimodal-evidence-reasoning, rag-citation-grounded-answering, meta-prompting, plan-and-solve-prompting

**Recipes upgraded (11):** eval-set-generator, regression-judge, panel-review, plan-and-solve, verification-pass, self-refine-pass, source-grounded-answer, rag-answer-contract, citation-matrix, claim-checker, risk-register

**No-churn (prior wave):** react, tool-calling-contract

**New cards:** none (strict gate)

## RV fix (session review findings)

| ID | Fix |
| --- | --- |
| RV-001 | Restore 26 cards from HEAD; re-apply method fields via catalog-core emitter (no PyYAML dump) |
| RV-002 | Surgical field-only diffs (~108 insertions / 26 files); dump-churn scanner clean |
| RV-003 | Six CONTROL_NOTE allowlist recipes retain one-sentence notes; non-allowlist stay `null` |
| RV-004 | MM / provider-agent-frameworks / rag-citation tracks deepened with official extracts |
| RV-005 | Agents claims use `developers.openai.com/.../agents/guardrails-approvals`; platform path retired |

## Sources

- All 119 `sources.yaml` `last_checked` → 2026-07-31 inventory-refresh
- 22-id content-deep live set noted in source-refresh.md + ledger-source-deltas.md
- Card sources rewritten to canonical manifest URLs

## Validation (post RV fix)

- `pnpm catalog:validate` ✓
- `pnpm catalog:readme` ✓
- `pnpm catalog:site-data` ✓
- `python3 scripts/check_sources_manifest.py --check` ✓
- `python3 scripts/check_readme_recipes.py --check` ✓
- `python3 scripts/update_readme_badges.py --check` ✓
- `python3 -m unittest tests.test_catalog_ultradeep_research_enrich_2026_07_31` ✓

## Intentional residuals

See `research/residual-gaps.md`. Not all 91 cards rewritten; no new cards; not full 119 content-deep.

## Foreign dirty tree

Unrelated `web/**` / `DESIGN.md` / other goal scratch files left untouched for this ship set.

## RV residual closeout (2026-08-04)

Session-review residuals RV-001…005 closed (see `research/RV-RESIDUAL-VERDICT.md`). Product micro-patches + offline extract supports + track URL + stage-files hygiene. Gates green.

