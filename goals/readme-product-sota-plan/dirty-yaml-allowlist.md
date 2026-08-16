# J0 dirty YAML freeze

**Date:** 2026-08-16  
**Rule:** T062 will bake allowlisted dirty recipes. Do not “fix” out-of-program dirty YAML. Featured extras run on bake files plus in-program edits.

## Dirty recipes — **bake** (33)

Prior catalog research work ships with this generate. Class cascade + listed extras apply.

| File | Class | Extra |
| --- | --- | --- |
| `source-grounded-answer.yaml` | research | buried preview / YAML-legal safety |
| `web-research-brief.yaml` | research | cascade |
| `claim-checker.yaml` | research | cascade |
| `citation-matrix.yaml` | research | cascade |
| `disagreement-map.yaml` | research | cascade |
| `executive-brief.yaml` | editorial | cascade |
| `rewrite-with-constraints.yaml` | editorial | cascade |
| `dense-summary.yaml` | editorial | cascade |
| `newsletter-draft.yaml` | editorial | cascade |
| `code-review.yaml` | code | optional second primary (P2) |
| `bug-rca.yaml` | code | cascade |
| `unit-test-writer.yaml` | code | cascade |
| `api-contract-explainer.yaml` | code | cascade |
| `json-extractor.yaml` | extract | **keep custom upgrade_when**; SO hosts |
| `table-normalizer.yaml` | extract | cascade |
| `classifier.yaml` | extract | cascade |
| `ner-extractor.yaml` | extract | cascade |
| `prd-drafter.yaml` | product | cascade |
| `user-story-splitter.yaml` | product | cascade |
| `launch-checklist.yaml` | product | cascade |
| `ux-review.yaml` | product | cascade |
| `incident-summary.yaml` | ops | cascade |
| `runbook-generator.yaml` | ops | cascade |
| `log-triage.yaml` | ops | cascade |
| `decision-memo.yaml` | ops | cascade |
| `prompt-optimizer.yaml` | tools | Evals sunset |
| `tool-use-planner.yaml` | tools | guardrails-approvals |
| `rag-answer-contract.yaml` | tools | Gemini grounding iff fetch proves |
| `prompt-injection-scanner.yaml` | tools | OWASP 2026/final |
| `plan-and-solve.yaml` | reasoning | cascade |
| `verification-pass.yaml` | reasoning | cascade |
| `self-refine-pass.yaml` | reasoning | cascade |
| `tradeoff-matrix.yaml` | reasoning | cascade |

## Clean recipes — in-program cascade (15)

Not dirty. Cascade T020 one-liner + extras if listed. `eval-set-generator.yaml` / `regression-judge.yaml` extras after T010. `risk-register.yaml` NIST caveat after docs. `literature-scan.yaml` and other cleans: cascade only.

## Dirty non-recipe YAML

| Path | Decision |
| --- | --- |
| `catalog/index.yaml` | **bake** prior work; A-badges may change pale `color` only if T024 requires (it does **not** — see contrast-params). Class agents: do not edit. |
| `catalog/fixtures/index.yaml` | **out of this program** |
| `catalog/schema/*.json` | **out of this program** |
| `catalog/patterns/*` | none dirty; T050 writes `evaluation-flywheel.yaml` |

## Revert before generate

None. No dirty recipe is out-of-program.
