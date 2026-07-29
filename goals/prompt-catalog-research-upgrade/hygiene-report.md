# Hygiene report — RV-006 / RV-007

**Would-stage count:** 28

## Would stage (SHIP_A ∪ SHIP_B existing)

- `README.md`
- `catalog/patterns/react.yaml`
- `catalog/patterns/structured-outputs-json-schema.yaml`
- `catalog/patterns/tool-calling-contract.yaml`
- `catalog/recipes/prompt-injection-scanner.yaml`
- `catalog/recipes/tool-use-planner.yaml`
- `goals/prompt-catalog-research-upgrade/ARTIFACT_POLICY.md`
- `goals/prompt-catalog-research-upgrade/DROP.txt`
- `goals/prompt-catalog-research-upgrade/LIVE_IDS.txt`
- `goals/prompt-catalog-research-upgrade/SHIP_A.txt`
- `goals/prompt-catalog-research-upgrade/SHIP_B.txt`
- `goals/prompt-catalog-research-upgrade/facts.md`
- `goals/prompt-catalog-research-upgrade/facts.meta.json`
- `goals/prompt-catalog-research-upgrade/fix-report.md`
- `goals/prompt-catalog-research-upgrade/goal.md`
- `goals/prompt-catalog-research-upgrade/ledger-card-changelog.md`
- `goals/prompt-catalog-research-upgrade/ledger-gaps.md`
- `goals/prompt-catalog-research-upgrade/ledger-source-deltas.md`
- `goals/prompt-catalog-research-upgrade/ledger-task-status.md`
- `goals/prompt-catalog-research-upgrade/notes.md`
- `goals/prompt-catalog-research-upgrade/path-sets.json`
- `goals/prompt-catalog-research-upgrade/plan.md`
- `goals/prompt-catalog-research-upgrade/stage-allowlist.txt`
- `goals/prompt-catalog-research-upgrade/summary.md`
- `source-refresh.md`
- `sources.yaml`
- `tests/test_catalog_research_upgrade_2026_07_25.py`
- `web/src/data/catalog.json`

## DROP (must not stage)

- `goals/prompt-catalog-research-upgrade/facts-result.json` (exists)
- `goals/prompt-catalog-research-upgrade/facts-review.json` (exists)
- `goals/prompt-catalog-research-upgrade/interview-result.json` (exists)
- `goals/prompt-catalog-research-upgrade/interview.json` (exists)
- `goals/prompt-catalog-research-upgrade/plan-gate-result.json` (exists)
- `goals/prompt-catalog-research-upgrade/plan-gate-result.raw.json` (exists)
- `goals/prompt-catalog-research-upgrade/plan-gate-stderr.txt` (exists)
- `goals/prompt-catalog-research-upgrade/task-graph.json` (exists)

## Foreign paths still dirty (preserved, unstaged): 25

- `DESIGN.md`
- `pnpm-lock.yaml`
- `web/browser/web-smoke.spec.mjs`
- `web/index.html`
- `web/package.json`
- `web/src/app/App.tsx`
- `web/src/components/ui/Badge.tsx`
- `web/src/components/ui/Button.tsx`
- `web/src/components/ui/CopyableBlock.tsx`
- `web/src/features/recipes/HomePage.tsx`
- `web/src/main.tsx`
- `web/src/styles/app.css`
- `web/src/styles/tokens.css`
- `web/tsconfig.json`
- `web/vite.config.ts`
- `web/components.json`
- `web/src/components/CommandPalette.tsx`
- `web/src/components/theme-provider.tsx`
- `web/src/components/theme-toggle.tsx`
- `web/src/lib/command-index.test.ts`
- `web/src/lib/command-index.ts`
- `web/src/lib/theme-preference.test.ts`
- `web/src/lib/utils.ts`
- `web/src/styles/globals-css-contract.test.ts`
- `web/src/styles/globals.css`

## Red-team

- ship ∩ foreign = ∅
- would_stage ∩ DROP = ∅
- gates: sources + unittest + recipes green
- default mode: **dry-run** (no `git add` / no commit)

## How to stage later

```bash
# after review
while IFS= read -r f; do git add -- "$f"; done < goals/prompt-catalog-research-upgrade/stage-files.txt
git status --short
```
