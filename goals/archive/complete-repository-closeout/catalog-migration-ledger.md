<!-- markdownlint-disable MD013 -->

# Catalog migration ledger — Playbook v1

## Binding model

The pre-migration catalog contains 91 live assets: 48 Recipes and 43 Patterns.
The accepted v1 result contains 58 live assets: 24 Recipes, 11 Patterns, and 23
Playbooks.

A cluster is eligible only when it contains at least two assets that share the
same user job or materially duplicate both the same core method and operational
contract. A shared supporting technique does not qualify. Clustering is not
transitive: every member must independently satisfy the rule against the
canonical concept.

This ledger is reviewed archival provenance. Catalog YAML is still the forward
authoring source of truth; this file must never become a reverse generator or a
permanent semantic-equality oracle.

Execution materializes the same identities and field-level lineage in
`goals/complete-repository-closeout/migration-ledger.yaml`. Production loaders,
generators, Playbook YAML, and routes must not consume that archival file.

## Accounting invariants

- Exactly 91 source identities appear once and only once in the union of cluster
  members and singleton rows.
- Exactly 23 disjoint clusters contain 56 source assets.
- Exactly 35 source assets remain native singletons: 24 Recipes and 11 Patterns.
- Exactly 58 live assets remain after cutover: 24 Recipes, 11 Patterns, and 23
  Playbooks.
- Every Playbook has at least two source members, one globally unique canonical
  slug, and an explicit preservation review.
- No retired source record remains live, and no singleton is deleted, renamed,
  or silently absorbed.
- Similarity tooling may propose candidates; reviewed semantic evidence decides
  membership.

## Accepted Playbook clusters

| ID | Canonical Playbook and slug | Source members | Preservation contract |
| --- | --- | --- | --- |
| CRC-PLB-101 | Evidence-Grounded Answering — `evidence-grounded-answering` | Recipe `source-grounded-answer`; Recipe `rag-answer-contract`; Pattern `rag-citation-grounded-answering`; Pattern `multimodal-evidence-reasoning` | Supplied vs retrieved evidence, retrieval diagnostics, multimodal evidence, poisoning controls, citations, gaps, uncertainty |
| CRC-PLB-102 | Research Synthesis — `research-synthesis` | Recipe `web-research-brief`; Recipe `disagreement-map`; Pattern `research-synthesis` | Freshness, multi-document synthesis, disagreement-first analysis, decision impact |
| CRC-PLB-103 | Dense Summarization — `dense-summarization` | Recipe `dense-summary`; Pattern `chain-of-density-summarization` | Fixed-length iterative density, salient entities, preserved/dropped details |
| CRC-PLB-104 | Text Classification — `text-classification` | Recipe `classifier`; Pattern `text-classification` | Predefined labels, rationale, confidence, abstention |
| CRC-PLB-105 | Named Entity Extraction — `named-entity-extraction` | Recipe `ner-extractor`; Pattern `ner-named-entity-recognition` | Typed entities, spans/evidence, normalization, confidence |
| CRC-PLB-106 | Sentiment Triage — `sentiment-triage` | Recipe `sentiment-triage`; Pattern `sentiment-analysis` | Affect/stance, urgency, operational routing |
| CRC-PLB-107 | Schema-Bound JSON Output — `schema-bound-json-output` | Recipe `json-extractor`; Pattern `structured-outputs-json-schema` | Messy-text extraction, native schema enforcement, validation/retry, prompt-only fallback |
| CRC-PLB-108 | Synthetic Evaluation Data — `synthetic-evaluation-data` | Recipe `synthetic-edge-cases`; Recipe `eval-set-generator`; Pattern `data-augmentation` | Failure-seeded regressions, adversarial edges, labels, balanced variants, review |
| CRC-PLB-109 | Unit-Test Authoring — `unit-test-authoring` | Recipe `unit-test-writer`; Pattern `python-unit-test-writer` | Language-neutral design plus Python framework, fixture, edge, and residual guidance |
| CRC-PLB-110 | UX Review — `ux-review` | Recipe `ux-review`; Pattern `ux-review-checklist` | Evidence, severity, fixes, validation, audience, accessibility, consistency, interaction |
| CRC-PLB-111 | Panel Deliberation — `panel-deliberation` | Recipe `panel-review`; Pattern `panelgpt`; Pattern `expert-panel-discussion` | Relevant simulated perspectives, independent positions, cross-critique, gaps, disagreement, persona rejection, real-review triggers |
| CRC-PLB-112 | Plan-and-Solve — `plan-and-solve` | Recipe `plan-and-solve`; Pattern `plan-and-solve-prompting` | Short plan, missing-step checks, private reasoning controls, visible contract, evidence caveats |
| CRC-PLB-113 | Step-Back Reasoning — `step-back-reasoning` | Recipe `step-back-answer`; Pattern `step-back-prompting` | Governing abstraction, concrete answer, evidence limits, model/API controls |
| CRC-PLB-114 | Evidence Verification — `evidence-verification` | Recipe `verification-pass`; Recipe `claim-checker`; Pattern `chain-of-verification` | Single-claim verdicts, artifact audits, verification questions, source/tool checks, corrections |
| CRC-PLB-115 | Artifact Refinement — `artifact-refinement` | Recipe `self-refine-pass`; Pattern `self-refine`; Pattern `reflexion`; Pattern `quick-enhance` | Targeted enhancement, bounded critique, external feedback, change logs, stop rules |
| CRC-PLB-116 | Prompt-Injection Defense — `prompt-injection-defense` | Recipe `prompt-injection-scanner`; Pattern `prompt-injection-defense` | Exploit/severity analysis, trust boundaries, retrieval/tool effects, mitigation, regressions |
| CRC-PLB-117 | Eval-Driven Prompt Optimization — `eval-driven-prompt-optimization` | Recipe `prompt-optimizer`; Pattern `meta-prompting`; Pattern `eval-driven-prompt-optimization`; Pattern `evaluation-flywheel` | Candidate ideation, held-out selection, controlled iteration, regressions, rollback |
| CRC-PLB-118 | Tool Action Contract — `tool-action-contract` | Recipe `tool-use-planner`; Pattern `tool-calling-contract` | Permitted calls, argument validation, prerequisites, approval, effects, stop conditions, verification |
| CRC-PLB-119 | Decision Comparison — `decision-comparison` | Recipe `decision-memo`; Recipe `tradeoff-matrix` | Durable record, explicit criteria, sensitivity, recommendation, revisit triggers |
| CRC-PLB-120 | Zero-Shot Prompt Contract — `zero-shot-prompt-contract` | Pattern `direct-zero-shot`; Pattern `structured-zero-shot` | Minimal direct execution plus bounded context, constraints, output contract |
| CRC-PLB-121 | Few-Shot Example Selection — `few-shot-example-selection` | Pattern `few-shot-prompting`; Pattern `active-prompt` | Curated examples, uncertainty selection, annotation budgets, labels, formats, edges |
| CRC-PLB-122 | Reasoning Draft Control — `reasoning-draft-control` | Pattern `zero-shot-chain-of-thought`; Pattern `chain-of-draft` | Concise/private draft controls, cost/latency, no default long visible chain-of-thought |
| CRC-PLB-123 | Branching Reasoning Search — `branching-reasoning-search` | Pattern `tree-of-thoughts`; Pattern `graph-of-thoughts` | Branching, pruning, scoring, graph merging/recombination/revisit, cost, eval |

Canonical slugs above are the proposed v1 source and route identities. A slug
reused from a retired member is a new type-neutral identity at
`/catalog/<slug>/`; it is not an alias or compatibility path.

## Native singleton Recipes

| Group | Slugs | Singleton reason |
| --- | --- | --- |
| Product | `acceptance-criteria-writer`, `prd-drafter`, `user-story-splitter`, `launch-checklist`, `support-macro` | Distinct product-delivery jobs and output contracts |
| Coding | `api-contract-explainer`, `bug-rca`, `code-review`, `pr-description`, `refactor-planner` | Distinct engineering artifacts and review/planning jobs |
| Research and writing | `citation-matrix`, `executive-brief`, `faq-generator`, `literature-scan`, `newsletter-draft`, `rewrite-with-constraints`, `style-transfer-without-examples` | Distinct outputs; shared evidence or writing techniques do not establish the same operational contract |
| Operations | `incident-summary`, `log-triage`, `meeting-action-extractor`, `risk-register`, `runbook-generator` | Distinct incident, meeting, risk, and operational-document jobs |
| Data | `table-normalizer` | Unique structured-normalization job |
| Evaluation | `regression-judge` | Unique pass/fail regression judgment contract |

## Native singleton Patterns

| Group | Slugs | Singleton reason |
| --- | --- | --- |
| Knowledge and representation | `knowledge-base-engineer`, `markmap-generator` | Different end products and operational contracts |
| Agent and context design | `context-engineering`, `react` | Broad but distinct agent-context and reasoning/action design methods |
| Reasoning and prompt methods | `algorithm-of-thoughts`, `emotional-persuasion-prompting`, `intentional-analysis`, `program-of-thoughts`, `prompt-chaining`, `self-consistency`, `skeleton-of-thought` | Each method has a distinct control structure, evidence claim, or execution contract; thematic relatedness alone is insufficient |

## Playbook source and composer contract

Each Playbook schema must specialize, validate, and publish:

- identity, taxonomy, title, and definition;
- best use and avoid-when guidance;
- model/API controls, cost and latency, and failure modes;
- evidence tier, source type, clickable sources, caveat, and eval requirement;
- required durable instruction blocks;
- one selected author-approved task/output mode;
- optional typed context, tool, and evidence modules;
- mandatory safety and validation clauses where applicable;
- a deterministic ordering and exactly one copyable composed prompt.

Retired source identities exist only in the goal-local archival migration
ledger. They are not fields in live Playbook YAML, routing metadata, search
records, or generated public payloads.

Every source member's materially distinct workflow, output promise, safety
constraint, caveat, evidence claim, and source must be either represented in the
Playbook or explicitly shown to be redundant. Shared language is deduplicated;
meaning is not.

The resolved bounded-composer contract is:

- one to six modes, unique stable IDs, exactly one default, and exactly one
  selected at runtime;
- zero to twelve optional modules with unique stable IDs, one of `context`,
  `tool`, or `evidence`, an author-declared fixed position, allowed-mode set,
  and optional `requires`/`conflicts` constraints;
- fixed assembly order: durable instructions, trust boundaries and inputs,
  selected task/output mode, context, tool permissions/effects, evidence,
  output contract, safety/eval clauses, and final validation;
- optional modules cannot remove, reorder, or override required blocks or
  mandatory safety/validation clauses;
- unknown, duplicate, conflicting, or unsatisfied selections do not compose;
  the UI explains the invalid state and offers one reset to the author default;
- safe share state encodes the selected mode ID and module IDs in author order,
  strips unknown keys/values, removes duplicates, and replaces non-canonical
  query order without ever serializing free text; and
- every Playbook has golden output for its default and every supported mode,
  pairwise module coverage, and explicit invalid-combination fixtures.

## README, taxonomy, and discovery contract

- Every Playbook belongs to exactly one of the existing eight job lanes and may
  have secondary search tags. Patterns remain in pattern sections.
- Catalog index membership gains `playbook_slugs`; recipe-only featured items,
  shortcuts, and job maps become discriminated `{kind, slug}` references where
  the surface genuinely supports both. No duplicate membership is used as a
  secondary taxonomy.
- README hero/count/navigation surfaces truthfully show 24 Recipes, 11 Patterns,
  and 23 Playbooks.
- README keeps the native Recipe card contract for 24 Recipes and Pattern-note
  contract for 11 Patterns. Each Playbook renders one shared guidance/evidence
  card, its finite mode/module table, and one copyable default composition. It
  links to the web composer for other valid combinations and never reproduces
  retired member cards or a variants dump.
- Home, unified Catalog, search, palette, preview, and Explorer use the same
  discriminated union and type-neutral canonical link helper.

## URL and privacy contract

- `/catalog/` is the only catalog browse/search page.
- `/catalog/<slug>/` is the only detail route form for every kind.
- A shareable query may contain only allowlisted, non-sensitive mode/module IDs
  in a deterministic canonical order.
- Pasted values, trusted context, untrusted input, composed prompt text, and
  open-in-chat payloads never enter the URL, browser storage, cookies,
  analytics, telemetry, or persisted application state.
- Refreshing or sharing a safe configuration restores selections only. It never
  reconstructs user-provided text.
- Open-in-chat is repository-wide: explicit activation copies the current prompt
  to the clipboard and opens only the provider's base chat page. Provider URLs,
  referrers, history, and network requests never contain the prompt. If copy
  fails, the UI announces the failure and does not claim that content was
  transferred.

## Clean cutover procedure

For every cluster, execute this sequence within the catalog migration barrier:

1. Author and individually schema-check a proposal under the goal's temporary
   staging directory, outside the live catalog, so canonical slugs reused from
   retiring assets cannot collide during parallel work.
2. Complete source/claim/field-level preservation review against every named
   source member.
3. Under one merge lease, publish all 23 proposals into `catalog/playbooks/`
   while removing all 56 clustered member YAML records from their typed
   collections in the same working-tree cutover.
4. Remove retired slugs from indexes, shortcuts, job maps, generators, fixtures,
   tests, links, search records, and current documentation.
5. Preserve provenance only in the goal-local archival ledger; delete temporary
   proposals after their live files and lineage receipts are verified.
6. Publish only `/catalog/<slug>/` for the canonical Playbook.
7. Remove typed Recipe/Pattern detail routes for both clustered members and
   singletons; publish singleton details at the same type-neutral route form.
8. Do not add old typed route redirects, aliases, hidden compatibility anchors,
   legacy shells, compatibility metadata, dual readers, or schema adapters.
9. Assert all 91 old typed detail paths plus `/recipes/` and `/patterns/` have
   normal not-found behavior locally, in `web/dist`, and on production.
10. Retain `/sources/` and `/research/` only as the two independently specified
    Explore shortcuts; count them separately from zero catalog-compatibility
    redirects. Treat `cleanUrls`/`trailingSlash` normalization separately.

The migration is committed as a one-way v1 source and public-format cutover.
Git history is the rollback and forensic record; runtime compatibility code is
not.

## Automated verification

The implementation must provide deterministic checks for:

- pre-migration input count 91 and identity snapshot;
- 23 disjoint clusters containing exactly 56 unique members;
- 35 exact singleton identities, split 24 Recipes and 11 Patterns;
- post-migration counts of 24 Recipes, 11 Patterns, and 23 Playbooks;
- global live slug uniqueness and exactly 58 canonical detail routes;
- all retired clustered YAML absent and all singleton YAML preserved;
- every Playbook schema field, source, mode, module, and combination valid;
- deterministic prompt composition and golden fixtures;
- required clauses that cannot be disabled by optional configuration;
- safe query canonicalization and rejection/stripping of unknown values;
- no sensitive free text in URL, storage, cookies, analytics, or history;
- `/catalog/` kind filtering and all canonical detail links;
- old typed catalog routes absent from client routes, static shells, sitemap,
  `llms.txt`, `llms-full.txt`, metadata, and internal links;
- exhaustive HTTP/browser not-found behavior for all 93 retired typed catalog
  URLs, including every reused slug;
- README, badges, counts, site data, SEO/AEO, and route shells generated from
  the typed catalog source rather than hand-authored copies.

## Manual assurance

On the exact production SHA, manually exercise at least one Recipe, Pattern,
and Playbook on desktop/mobile and light/dark themes. For the Playbook, test all
author-approved modes, representative valid/invalid module combinations,
keyboard-only operation, live status, copy/open-in-chat, refresh/share, and
back/forward navigation.

Use a unique synthetic, non-secret sentinel and verify it never appears in the
address bar, copied safe-share URL, browser storage/cookies, analytics/network
requests, console, page source, or restored state. Confirm all 58 canonical
routes programmatically; confirm all 93 retired typed routes programmatically,
then manually sample every retired route family including reused slugs.

## Known risks and guards

- **Over-merge:** distinct jobs can disappear. Guard with per-member preservation
  review, independent semantic review, and author-approved modes/modules.
- **Under-merge:** duplicated jobs can remain. Guard with complete 91-asset audit
  and an explicit singleton reason for every non-member.
- **Transitive mega-clusters:** thematic bridges can collapse unrelated work.
  Guard by testing each member directly against the canonical rule.
- **Evidence weakening:** source deduplication can lose caveats or provenance.
  Guard with source/claim preservation matrices and live research.
- **Privacy regression:** route state can accidentally serialize prompt content.
  Guard with allowlisted ID-only encoding plus unique-value browser/network
  probes.
- **Two-kind assumptions:** fixed counts and kind unions are distributed across
  core, Python checkers, web, SEO, browser smoke, badges, and docs. Guard with
  repo-wide exact-symbol review after the typed schema is fixed.
