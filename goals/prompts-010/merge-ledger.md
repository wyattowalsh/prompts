<!-- markdownlint-disable MD013 MD033 -->

# Merge ledger — flatten prompt catalog

Execute-time archival provenance for `goals/prompts-010`. Every current
`catalog/recipes/*.yaml` and `catalog/patterns/*.yaml` file appears exactly
once as a merged member or a singleton. Production loaders, generators, and
routes must not read this file or retired source ids. Catalog YAML is not
edited in this pass.

Companion machine file: [merge-ledger.yaml](./merge-ledger.yaml).

## Accounting

| Measure | Count |
| --- | ---: |
| Recipe source files | 48 |
| Pattern source files | 43 |
| Source files (must be 91) | 91 |
| Merged groups | 7 |
| Source files consumed by merges | 15 |
| Singletons | 76 |
| Canonical prompts | 83 |

`48 + 43 = 91` source files.
`15 + 76 = 91` accounted sources.
`7 + 76 = 83` canonical prompts.

## Rules

- Merge only when records are the **same job in different shapes**, share a
  **lane**, and share a **title stem**. Neighboring techniques stay separate
  and may later use YAML `related`.
- Closeout’s 23 Playbook clusters are a **candidate list, not membership**.
  Cross-lane clusters fail. No Playbook kind, noun, or composer.
- Merged paste-first prompts are facet `job`. Pattern singletons are facet
  `method`. Recipe singletons are facet `job`.
- Each prompt has 1–4 named modes and exactly one default. Modes own the paste
  path.
- Merged prompts mint **new** canonical slugs. Do not inherit recipe filenames
  such as `panel-review`.
- Type-suffix leftovers (`*-checklist`, `python-*`, split `*-prompting`)
  are renamed by the merge slugs that consume them.
- Famous already-good slugs `code-review` and `tree-of-thoughts` stay.
- Reserved slugs are not used: `catalog`, `explore`, `sources`,
  `recipes`, `patterns`, `research`, `github`.
- Former pattern `section` values map onto the eight lanes:
  `research`, `writing`, `coding`, `data`, `product`,
  `operations`, `agents`, `reasoning`.

## Required merges

| Canonical slug | Lane | Facet | Modes (default in bold in the full table) | Sources |
| --- | --- | --- | --- | --- |
| `plan-then-solve` | reasoning | job | `paste` default, `method` | `catalog/recipes/plan-and-solve.yaml`, `catalog/patterns/plan-and-solve-prompting.yaml` |
| `usability-review` | product | job | `paste` default, `checklist` | `catalog/recipes/ux-review.yaml`, `catalog/patterns/ux-review-checklist.yaml` |
| `unit-test-authoring` | coding | job | `general` default, `python` | `catalog/recipes/unit-test-writer.yaml`, `catalog/patterns/python-unit-test-writer.yaml` |
| `simulated-panel` | reasoning | job | `review` default, `panelgpt`, `discussion` | `catalog/recipes/panel-review.yaml`, `catalog/patterns/panelgpt.yaml`, `catalog/patterns/expert-panel-discussion.yaml` |

## Required non-merge

`tree-of-thoughts` and `graph-of-thoughts` remain two method prompts in the
reasoning lane. They may later list each other in `related`.

## Additional same-job keeps

Closeout candidates were reviewed independently. These pairs share title stem,
lane, and job, so they merge. They are not Playbook membership.

| Canonical slug | Lane | Facet | Sources | Why |
| --- | --- | --- | --- | --- |
| `step-back-reasoning` | reasoning | job | `catalog/recipes/step-back-answer.yaml`, `catalog/patterns/step-back-prompting.yaml` | Same 1:1 class as plan-and-solve; retires type-suffix `*-prompting`. |
| `critique-revise` | reasoning | job | `catalog/recipes/self-refine-pass.yaml`, `catalog/patterns/self-refine.yaml` | Same named self-refine job. Reflexion and Quick Enhance stay out. |
| `named-entity-extraction` | data | job | `catalog/recipes/ner-extractor.yaml`, `catalog/patterns/ner-named-entity-recognition.yaml` | Same NER extraction job. |

## Closeout candidate review (not membership)

| ID | Proposed Playbook slug | Members | Decision | Reason |
| --- | --- | --- | --- | --- |
| CRC-PLB-101 | `evidence-grounded-answering` | source-grounded-answer, rag-answer-contract, rag-citation-grounded-answering, multimodal-evidence-reasoning | reject | Cross-lane cluster (research vs agents). Supplied-source answering, RAG contracts, and multimodal evidence are neighboring jobs, not one job. |
| CRC-PLB-102 | `research-synthesis` | web-research-brief, disagreement-map, research-synthesis | reject | Three distinct research jobs (brief, disagreement map, synthesis method). |
| CRC-PLB-103 | `dense-summarization` | dense-summary, chain-of-density-summarization | reject | Neighboring: writing job vs named Chain-of-Density iterative algorithm. Stay separate; may use related. |
| CRC-PLB-104 | `text-classification` | classifier, text-classification | reject | Same data lane, but titles do not share a stem (Classifier vs Text Classification). Fail-closed on the title/lane/job test. |
| CRC-PLB-105 | `named-entity-extraction` | ner-extractor, ner-named-entity-recognition | keep-pair | Independent same-job pair: shared NER title stem, data lane, extraction contract. |
| CRC-PLB-106 | `sentiment-triage` | sentiment-triage, sentiment-analysis | reject | Operational triage/routing vs general sentiment analysis are different jobs. |
| CRC-PLB-107 | `schema-bound-json-output` | json-extractor, structured-outputs-json-schema | reject | Messy-text extraction vs provider-enforced schema are different jobs. |
| CRC-PLB-108 | `synthetic-evaluation-data` | synthetic-edge-cases, eval-set-generator, data-augmentation | reject | Cross-lane (data vs agents) and mixed jobs (edge cases, eval sets, augmentation). |
| CRC-PLB-109 | `unit-test-authoring` | unit-test-writer, python-unit-test-writer | keep-required | Required same-job pair. |
| CRC-PLB-110 | `ux-review` | ux-review, ux-review-checklist | keep-required | Required same-job pair. Canonical slug minted as usability-review. |
| CRC-PLB-111 | `panel-deliberation` | panel-review, panelgpt, expert-panel-discussion | keep-required | Required same-job trio. Canonical slug minted as simulated-panel. |
| CRC-PLB-112 | `plan-and-solve` | plan-and-solve, plan-and-solve-prompting | keep-required | Required same-job pair. Canonical slug minted as plan-then-solve. |
| CRC-PLB-113 | `step-back-reasoning` | step-back-answer, step-back-prompting | keep-pair | Independent same-job 1:1; also retires a type-suffix *-prompting leftover. |
| CRC-PLB-114 | `evidence-verification` | verification-pass, claim-checker, chain-of-verification | reject | Cross-lane (reasoning vs research). Verification pass, claim checker, and CoVe stay separate. |
| CRC-PLB-115 | `artifact-refinement` | self-refine-pass, self-refine, reflexion, quick-enhance | keep-pair-only | Keep only Self-Refine Pass + Self-Refine. Reject Reflexion and Quick Enhance as neighboring techniques. |
| CRC-PLB-116 | `prompt-injection-defense` | prompt-injection-scanner, prompt-injection-defense | reject | Audit-scanner vs design-defense are different jobs. |
| CRC-PLB-117 | `eval-driven-prompt-optimization` | prompt-optimizer, meta-prompting, eval-driven-prompt-optimization, evaluation-flywheel | reject | Mega-cluster of neighboring optimizer, meta-prompt, eval-driven, and flywheel methods. |
| CRC-PLB-118 | `tool-action-contract` | tool-use-planner, tool-calling-contract | reject | Plan-before-acting vs tool-calling contract are neighboring agent jobs. |
| CRC-PLB-119 | `decision-comparison` | decision-memo, tradeoff-matrix | reject | Cross-lane (operations vs reasoning). Durable memo vs criteria matrix are different jobs. |
| CRC-PLB-120 | `zero-shot-prompt-contract` | direct-zero-shot, structured-zero-shot | reject | Two neighboring zero-shot methods, not one job. |
| CRC-PLB-121 | `few-shot-example-selection` | few-shot-prompting, active-prompt | reject | Neighboring example-selection methods. |
| CRC-PLB-122 | `reasoning-draft-control` | zero-shot-chain-of-thought, chain-of-draft | reject | Neighboring draft-control methods. |
| CRC-PLB-123 | `branching-reasoning-search` | tree-of-thoughts, graph-of-thoughts | reject-required-non-merge | Required non-merge. Neighboring branching-search techniques stay two prompts. |

## Slug policy

Merged prompts mint new slugs:

- `plan-and-solve` + `plan-and-solve-prompting` → `plan-then-solve`
- `ux-review` + `ux-review-checklist` → `usability-review`
- `unit-test-writer` + `python-unit-test-writer` → `unit-test-authoring`
- `panel-review` + `panelgpt` + `expert-panel-discussion` → `simulated-panel`
- `step-back-answer` + `step-back-prompting` → `step-back-reasoning`
- `self-refine-pass` + `self-refine` → `critique-revise`
- `ner-extractor` + `ner-named-entity-recognition` → `named-entity-extraction`

Kept famous slugs: `code-review`, `tree-of-thoughts`.

Not renamed:

- `launch-checklist` — checklist is the product deliverable, not a type suffix.
- `few-shot-prompting`, `emotional-persuasion-prompting`, `meta-prompting` —
  method names with no counterpart recipe, so `prompting` is not a
  recipe/pattern type suffix.

## Pattern section → lane mapping

Each former pattern is assigned one of the eight lanes from its job, not from
the retired section taxonomy.

| Former section | Lane mapping used here |
| --- | --- |
| `reasoning-and-search` | `reasoning`, except multimodal evidence → `research` |
| `verification-and-iteration` | `reasoning` for verification/self-consistency methods; `agents` for ReAct, Reflexion, and the evaluation flywheel |
| `core-prompt-construction` | `reasoning` for zero-shot / few-shot / active-prompt methods; `agents` for context, RAG, tools, injection defense, chaining, meta-prompt, eval-driven; `data` for structured JSON Schema outputs |
| `task-and-workflow-snippets` | mapped per job onto `data`, `writing`, `research`, `coding`, `product`, or `reasoning` |

## All canonical prompts

Default mode ids are bold. Source paths are the 91 files.

| Canonical slug | Disposition | Lane | Facet | Mode ids | Source paths |
| --- | --- | --- | --- | --- | --- |
| `citation-matrix` | singleton | research | job | **paste** | `catalog/recipes/citation-matrix.yaml` |
| `claim-checker` | singleton | research | job | **paste** | `catalog/recipes/claim-checker.yaml` |
| `disagreement-map` | singleton | research | job | **paste** | `catalog/recipes/disagreement-map.yaml` |
| `knowledge-base-engineer` | singleton | research | method | **template** | `catalog/patterns/knowledge-base-engineer.yaml` |
| `literature-scan` | singleton | research | job | **paste** | `catalog/recipes/literature-scan.yaml` |
| `multimodal-evidence-reasoning` | singleton | research | method | **template** | `catalog/patterns/multimodal-evidence-reasoning.yaml` |
| `research-synthesis` | singleton | research | method | **template** | `catalog/patterns/research-synthesis.yaml` |
| `source-grounded-answer` | singleton | research | job | **paste** | `catalog/recipes/source-grounded-answer.yaml` |
| `web-research-brief` | singleton | research | job | **paste** | `catalog/recipes/web-research-brief.yaml` |
| `chain-of-density-summarization` | singleton | writing | method | **template** | `catalog/patterns/chain-of-density-summarization.yaml` |
| `dense-summary` | singleton | writing | job | **paste** | `catalog/recipes/dense-summary.yaml` |
| `executive-brief` | singleton | writing | job | **paste** | `catalog/recipes/executive-brief.yaml` |
| `faq-generator` | singleton | writing | job | **paste** | `catalog/recipes/faq-generator.yaml` |
| `markmap-generator` | singleton | writing | method | **template** | `catalog/patterns/markmap-generator.yaml` |
| `newsletter-draft` | singleton | writing | job | **paste** | `catalog/recipes/newsletter-draft.yaml` |
| `quick-enhance` | singleton | writing | method | **template** | `catalog/patterns/quick-enhance.yaml` |
| `rewrite-with-constraints` | singleton | writing | job | **paste** | `catalog/recipes/rewrite-with-constraints.yaml` |
| `style-transfer-without-examples` | singleton | writing | job | **paste** | `catalog/recipes/style-transfer-without-examples.yaml` |
| `unit-test-authoring` | merged | coding | job | **general**, python | `catalog/recipes/unit-test-writer.yaml`<br>`catalog/patterns/python-unit-test-writer.yaml` |
| `api-contract-explainer` | singleton | coding | job | **paste** | `catalog/recipes/api-contract-explainer.yaml` |
| `bug-rca` | singleton | coding | job | **paste** | `catalog/recipes/bug-rca.yaml` |
| `code-review` | singleton | coding | job | **paste** | `catalog/recipes/code-review.yaml` |
| `pr-description` | singleton | coding | job | **paste** | `catalog/recipes/pr-description.yaml` |
| `refactor-planner` | singleton | coding | job | **paste** | `catalog/recipes/refactor-planner.yaml` |
| `named-entity-extraction` | merged | data | job | **paste**, method | `catalog/recipes/ner-extractor.yaml`<br>`catalog/patterns/ner-named-entity-recognition.yaml` |
| `classifier` | singleton | data | job | **paste** | `catalog/recipes/classifier.yaml` |
| `data-augmentation` | singleton | data | method | **template** | `catalog/patterns/data-augmentation.yaml` |
| `json-extractor` | singleton | data | job | **paste** | `catalog/recipes/json-extractor.yaml` |
| `sentiment-analysis` | singleton | data | method | **template** | `catalog/patterns/sentiment-analysis.yaml` |
| `sentiment-triage` | singleton | data | job | **paste** | `catalog/recipes/sentiment-triage.yaml` |
| `structured-outputs-json-schema` | singleton | data | method | **template** | `catalog/patterns/structured-outputs-json-schema.yaml` |
| `synthetic-edge-cases` | singleton | data | job | **paste** | `catalog/recipes/synthetic-edge-cases.yaml` |
| `table-normalizer` | singleton | data | job | **paste** | `catalog/recipes/table-normalizer.yaml` |
| `text-classification` | singleton | data | method | **template** | `catalog/patterns/text-classification.yaml` |
| `usability-review` | merged | product | job | **paste**, checklist | `catalog/recipes/ux-review.yaml`<br>`catalog/patterns/ux-review-checklist.yaml` |
| `acceptance-criteria-writer` | singleton | product | job | **paste** | `catalog/recipes/acceptance-criteria-writer.yaml` |
| `launch-checklist` | singleton | product | job | **paste** | `catalog/recipes/launch-checklist.yaml` |
| `prd-drafter` | singleton | product | job | **paste** | `catalog/recipes/prd-drafter.yaml` |
| `support-macro` | singleton | product | job | **paste** | `catalog/recipes/support-macro.yaml` |
| `user-story-splitter` | singleton | product | job | **paste** | `catalog/recipes/user-story-splitter.yaml` |
| `decision-memo` | singleton | operations | job | **paste** | `catalog/recipes/decision-memo.yaml` |
| `incident-summary` | singleton | operations | job | **paste** | `catalog/recipes/incident-summary.yaml` |
| `log-triage` | singleton | operations | job | **paste** | `catalog/recipes/log-triage.yaml` |
| `meeting-action-extractor` | singleton | operations | job | **paste** | `catalog/recipes/meeting-action-extractor.yaml` |
| `risk-register` | singleton | operations | job | **paste** | `catalog/recipes/risk-register.yaml` |
| `runbook-generator` | singleton | operations | job | **paste** | `catalog/recipes/runbook-generator.yaml` |
| `context-engineering` | singleton | agents | method | **template** | `catalog/patterns/context-engineering.yaml` |
| `eval-driven-prompt-optimization` | singleton | agents | method | **template** | `catalog/patterns/eval-driven-prompt-optimization.yaml` |
| `eval-set-generator` | singleton | agents | job | **paste** | `catalog/recipes/eval-set-generator.yaml` |
| `evaluation-flywheel` | singleton | agents | method | **template** | `catalog/patterns/evaluation-flywheel.yaml` |
| `meta-prompting` | singleton | agents | method | **template** | `catalog/patterns/meta-prompting.yaml` |
| `prompt-chaining` | singleton | agents | method | **template** | `catalog/patterns/prompt-chaining.yaml` |
| `prompt-injection-defense` | singleton | agents | method | **template** | `catalog/patterns/prompt-injection-defense.yaml` |
| `prompt-injection-scanner` | singleton | agents | job | **paste** | `catalog/recipes/prompt-injection-scanner.yaml` |
| `prompt-optimizer` | singleton | agents | job | **paste** | `catalog/recipes/prompt-optimizer.yaml` |
| `rag-answer-contract` | singleton | agents | job | **paste** | `catalog/recipes/rag-answer-contract.yaml` |
| `rag-citation-grounded-answering` | singleton | agents | method | **template** | `catalog/patterns/rag-citation-grounded-answering.yaml` |
| `react` | singleton | agents | method | **template** | `catalog/patterns/react.yaml` |
| `reflexion` | singleton | agents | method | **template** | `catalog/patterns/reflexion.yaml` |
| `regression-judge` | singleton | agents | job | **paste** | `catalog/recipes/regression-judge.yaml` |
| `tool-calling-contract` | singleton | agents | method | **template** | `catalog/patterns/tool-calling-contract.yaml` |
| `tool-use-planner` | singleton | agents | job | **paste** | `catalog/recipes/tool-use-planner.yaml` |
| `critique-revise` | merged | reasoning | job | **paste**, method | `catalog/recipes/self-refine-pass.yaml`<br>`catalog/patterns/self-refine.yaml` |
| `plan-then-solve` | merged | reasoning | job | **paste**, method | `catalog/recipes/plan-and-solve.yaml`<br>`catalog/patterns/plan-and-solve-prompting.yaml` |
| `simulated-panel` | merged | reasoning | job | **review**, panelgpt, discussion | `catalog/recipes/panel-review.yaml`<br>`catalog/patterns/panelgpt.yaml`<br>`catalog/patterns/expert-panel-discussion.yaml` |
| `step-back-reasoning` | merged | reasoning | job | **paste**, method | `catalog/recipes/step-back-answer.yaml`<br>`catalog/patterns/step-back-prompting.yaml` |
| `active-prompt` | singleton | reasoning | method | **template** | `catalog/patterns/active-prompt.yaml` |
| `algorithm-of-thoughts` | singleton | reasoning | method | **template** | `catalog/patterns/algorithm-of-thoughts.yaml` |
| `chain-of-draft` | singleton | reasoning | method | **template** | `catalog/patterns/chain-of-draft.yaml` |
| `chain-of-verification` | singleton | reasoning | method | **template** | `catalog/patterns/chain-of-verification.yaml` |
| `direct-zero-shot` | singleton | reasoning | method | **template** | `catalog/patterns/direct-zero-shot.yaml` |
| `emotional-persuasion-prompting` | singleton | reasoning | method | **template** | `catalog/patterns/emotional-persuasion-prompting.yaml` |
| `few-shot-prompting` | singleton | reasoning | method | **template** | `catalog/patterns/few-shot-prompting.yaml` |
| `graph-of-thoughts` | singleton | reasoning | method | **template** | `catalog/patterns/graph-of-thoughts.yaml` |
| `intentional-analysis` | singleton | reasoning | method | **template** | `catalog/patterns/intentional-analysis.yaml` |
| `program-of-thoughts` | singleton | reasoning | method | **template** | `catalog/patterns/program-of-thoughts.yaml` |
| `self-consistency` | singleton | reasoning | method | **template** | `catalog/patterns/self-consistency.yaml` |
| `skeleton-of-thought` | singleton | reasoning | method | **template** | `catalog/patterns/skeleton-of-thought.yaml` |
| `structured-zero-shot` | singleton | reasoning | method | **template** | `catalog/patterns/structured-zero-shot.yaml` |
| `tradeoff-matrix` | singleton | reasoning | job | **paste** | `catalog/recipes/tradeoff-matrix.yaml` |
| `tree-of-thoughts` | singleton | reasoning | method | **template** | `catalog/patterns/tree-of-thoughts.yaml` |
| `verification-pass` | singleton | reasoning | job | **paste** | `catalog/recipes/verification-pass.yaml` |
| `zero-shot-chain-of-thought` | singleton | reasoning | method | **template** | `catalog/patterns/zero-shot-chain-of-thought.yaml` |

## Merge mode map

| Canonical slug | Lane | Facet | Modes | Class |
| --- | --- | --- | --- | --- |
| `unit-test-authoring` | coding | job | `general` (default) ← `catalog/recipes/unit-test-writer.yaml`<br>`python` ← `catalog/patterns/python-unit-test-writer.yaml` | required |
| `named-entity-extraction` | data | job | `paste` (default) ← `catalog/recipes/ner-extractor.yaml`<br>`method` ← `catalog/patterns/ner-named-entity-recognition.yaml` | candidate keep |
| `usability-review` | product | job | `paste` (default) ← `catalog/recipes/ux-review.yaml`<br>`checklist` ← `catalog/patterns/ux-review-checklist.yaml` | required |
| `critique-revise` | reasoning | job | `paste` (default) ← `catalog/recipes/self-refine-pass.yaml`<br>`method` ← `catalog/patterns/self-refine.yaml` | candidate keep |
| `plan-then-solve` | reasoning | job | `paste` (default) ← `catalog/recipes/plan-and-solve.yaml`<br>`method` ← `catalog/patterns/plan-and-solve-prompting.yaml` | required |
| `simulated-panel` | reasoning | job | `review` (default) ← `catalog/recipes/panel-review.yaml`<br>`panelgpt` ← `catalog/patterns/panelgpt.yaml`<br>`discussion` ← `catalog/patterns/expert-panel-discussion.yaml` | required |
| `step-back-reasoning` | reasoning | job | `paste` (default) ← `catalog/recipes/step-back-answer.yaml`<br>`method` ← `catalog/patterns/step-back-prompting.yaml` | candidate keep |

## Verification

- Disk listing of `catalog/recipes/*.yaml` (48) plus `catalog/patterns/*.yaml`
  (43) equals 91, and each path appears in exactly one prompt row.
- Required merges are present with minted slugs and named modes.
- `tree-of-thoughts` and `graph-of-thoughts` are distinct singleton method
  prompts.
- No prompt uses a reserved slug.
- No Playbook kind is emitted. Closeout’s 23 clusters are recorded only as
  candidate review.
