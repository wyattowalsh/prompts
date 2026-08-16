# Logical leaves (hyperfine)

Physical owners stay the 8 YAML class agents + 4 pattern scanners. Each row is a schedulable leaf. Cascade = T020 one-liner only. Extra = listed fetch-backed edit. **Forbidden on every recipe leaf:** `badge.color`, `badge.logo`, `chip_label`, filled examples, cardinality.

`editorial` class lives in the **writing** lane. Do not rename the lane.

## Recipes T100–T147

| ID | File | Class owner | Extra (after J1) |
| --- | --- | --- | --- |
| T100 | `source-grounded-answer.yaml` | research | Buried preview / YAML-legal safety only |
| T101 | `web-research-brief.yaml` | research | — |
| T102 | `literature-scan.yaml` | research | — |
| T103 | `claim-checker.yaml` | research | — |
| T104 | `citation-matrix.yaml` | research | — |
| T105 | `disagreement-map.yaml` | research | — |
| T106 | `executive-brief.yaml` | editorial | — |
| T107 | `rewrite-with-constraints.yaml` | editorial | — |
| T108 | `style-transfer-without-examples.yaml` | editorial | — |
| T109 | `dense-summary.yaml` | editorial | — |
| T110 | `faq-generator.yaml` | editorial | — |
| T111 | `newsletter-draft.yaml` | editorial | — |
| T112 | `code-review.yaml` | code | Optional second primary source (P2) |
| T113 | `bug-rca.yaml` | code | — |
| T114 | `unit-test-writer.yaml` | code | — |
| T115 | `refactor-planner.yaml` | code | — |
| T116 | `pr-description.yaml` | code | — |
| T117 | `api-contract-explainer.yaml` | code | — |
| T118 | `json-extractor.yaml` | extract | **Keep custom upgrade_when**; SO host URLs (T014) |
| T119 | `table-normalizer.yaml` | extract | — |
| T120 | `classifier.yaml` | extract | — |
| T121 | `ner-extractor.yaml` | extract | — |
| T122 | `sentiment-triage.yaml` | extract | — |
| T123 | `synthetic-edge-cases.yaml` | extract | — |
| T124 | `prd-drafter.yaml` | product | — |
| T125 | `user-story-splitter.yaml` | product | — |
| T126 | `acceptance-criteria-writer.yaml` | product | — |
| T127 | `launch-checklist.yaml` | product | — |
| T128 | `ux-review.yaml` | product | — |
| T129 | `support-macro.yaml` | product | — |
| T130 | `risk-register.yaml` | ops | NIST RMF “being revised” if still current |
| T131 | `incident-summary.yaml` | ops | — |
| T132 | `runbook-generator.yaml` | ops | — |
| T133 | `log-triage.yaml` | ops | — |
| T134 | `decision-memo.yaml` | ops | — |
| T135 | `meeting-action-extractor.yaml` | ops | — |
| T136 | `prompt-optimizer.yaml` | tools | Evals platform sunset |
| T137 | `tool-use-planner.yaml` | tools | guardrails-approvals (T015) |
| T138 | `rag-answer-contract.yaml` | tools | Gemini grounding only if fetch proves |
| T139 | `prompt-injection-scanner.yaml` | tools | OWASP 2026/final |
| T140 | `eval-set-generator.yaml` | tools | Evals dashboard vs method if named |
| T141 | `regression-judge.yaml` | tools | same |
| T142 | `plan-and-solve.yaml` | reasoning | — |
| T143 | `step-back-answer.yaml` | reasoning | — |
| T144 | `verification-pass.yaml` | reasoning | — |
| T145 | `self-refine-pass.yaml` | reasoning | — |
| T146 | `panel-review.yaml` | reasoning | — |
| T147 | `tradeoff-matrix.yaml` | reasoning | — |

Cascade for T100–T147 may start at **J0** (T020 already on disk). Extras wait on the matching fetch memo, not on all of J1.

## Pattern scan T200–T203 (read-only) then writes

| ID | Section | Default write |
| --- | --- | --- |
| T200 | `core-prompt-construction` | Touch `eval-driven-prompt-optimization.yaml` only if it names Evals dashboard as current (then `L-pattern-eval`) |
| T201 | `reasoning-and-search` | Skip unless WT already stale (`program-of-thoughts`, `tree-of-thoughts` effort enums) |
| T202 | `verification-and-iteration` | **Write** `evaluation-flywheel.yaml` (T050) |
| T203 | `task-and-workflow-snippets` | Skip; `chain-of-density-summarization` only if fetch proves |

Scanners return `touch` / `skip` per file. Only `L-pattern-eval` writes.

## Shell / chrome / generator leaves (not YAML)

Already in [task-graph.md](task-graph.md): T000–T092. v3 adds T024 contrast spec; splits T033a–d; J2 quorum; C14 TOC heading.
