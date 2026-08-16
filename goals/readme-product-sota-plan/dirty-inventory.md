# T000 git inventory

**Date:** 2026-08-16  
**Branch:** `main...origin/main` (ahead 15)  
**Generate:** not run.

## Bucket: catalog recipes (dirty — 33 files)

All are in the 48-leaf set. See [dirty-yaml-allowlist.md](dirty-yaml-allowlist.md) for bake/revert/out-of-program.

`api-contract-explainer.yaml` `bug-rca.yaml` `citation-matrix.yaml` `claim-checker.yaml` `classifier.yaml` `code-review.yaml` `decision-memo.yaml` `dense-summary.yaml` `disagreement-map.yaml` `executive-brief.yaml` `incident-summary.yaml` `json-extractor.yaml` `launch-checklist.yaml` `log-triage.yaml` `ner-extractor.yaml` `newsletter-draft.yaml` `plan-and-solve.yaml` `prd-drafter.yaml` `prompt-injection-scanner.yaml` `prompt-optimizer.yaml` `rag-answer-contract.yaml` `rewrite-with-constraints.yaml` `runbook-generator.yaml` `self-refine-pass.yaml` `source-grounded-answer.yaml` `table-normalizer.yaml` `tool-use-planner.yaml` `tradeoff-matrix.yaml` `unit-test-writer.yaml` `user-story-splitter.yaml` `ux-review.yaml` `verification-pass.yaml` `web-research-brief.yaml`

## Bucket: catalog recipes (clean — 15 files)

In-program cascade only (not dirty). `acceptance-criteria-writer.yaml` `eval-set-generator.yaml` `faq-generator.yaml` `literature-scan.yaml` `meeting-action-extractor.yaml` `panel-review.yaml` `pr-description.yaml` `refactor-planner.yaml` `regression-judge.yaml` `risk-register.yaml` `sentiment-triage.yaml` `step-back-answer.yaml` `style-transfer-without-examples.yaml` `support-macro.yaml` `synthetic-edge-cases.yaml`

## Bucket: catalog patterns

None dirty. `evaluation-flywheel.yaml` is in-program at T050.

## Bucket: catalog shell / index / schema

- `catalog/index.yaml` (dirty) — class agents forbidden; A-badges may touch pale fills only
- `catalog/fixtures/index.yaml` — **out of program**
- `catalog/schema/*.json` — out of program
- `catalog/shell/{preamble,middle,post,manifest,README}.md` — in-program shell locks

## Bucket: publisher / catalog-core

- **WT compile SSOT:** `package.json` `catalog:readme` → `node scripts/catalog_readme.mjs` (untracked)
- HEAD still pointed at `catalog.mjs generate readme` + badge postprocessor
- Dirty: `packages/catalog-core/src/emit-readme.js`, tests, deleted extract/fidelity modules, untracked publisher/check scripts

## Bucket: web/** (do not touch)

Dirty and untracked Vite/React redesign, public assets, explorer, SEO, tests. Preserve. Never `git add -A`.

## Bucket: other goals / docs / CI

- `goals/readme-product-sota-plan/` — this program (untracked)
- `goals/codebase-sota-improvement/**`, `goals/prompt-catalog-research-upgrade/**`, `goals/web-design-sota-enrich/**` — out of program except this folder
- `openspec/changes/finish-web-redesign-seo-security/` — **do not hitch**
- `AGENTS.md` `DESIGN.md` skill references, workflows, `source-refresh.md` — dirty; touch only if this program requires

## Hygiene

No `git add -A`. No commit. No push. Unrelated dirty files stay unstaged.
