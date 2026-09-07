<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## MODIFIED Requirements

### Requirement: Discovery artifacts expose only canonical content

The sitemap and machine-readable discovery files SHALL contain canonical,
indexable content routes only (`/`, `/explore/`, `/catalog/<slug>/` per prompt).
They MUST NOT list `/recipes/` or `/patterns/` trees. Production builds MUST
resolve an explicit verified base URL from trusted environment input and MUST fail
rather than publishing preview-domain or local canonical URLs.

`web/scripts/emit-seo.mjs`, its tests, route/discovery projections, and full
Markdown serialization MUST consume the validated canonical prompt package or its
canonical generated projection. They MUST NOT read or emit prompt-level `order` or
`eval_required`. Prompt sections in the full Markdown export MUST follow canonical
lane and `prompt_slugs` order; route inventory ordering remains governed by the
route-publication contract rather than becoming a second prompt-authoring order.

The full Markdown export SHALL serialize every public prompt field from the
catalog source of truth, including evaluation policy and rationale, every
policy-valid structured acceptance check's ID, type, branch fields, and authored
order, the selected mode's placeholders, complete post-copy guidance, safety
checks, optional operational fields, templates or omission reasons, modes,
related slugs, and clickable sources. Paste-path Fill guidance MUST use the shared
human projection of `fill_pointer: match_placeholder_table`; the raw
`match_placeholder_table` token MUST NOT appear as user-facing output. No-paste
modes MUST preserve their omission reason without fabricated prompt, Fill,
Expected output, Upgrade when, or acceptance checks. Content containing Markdown
fence delimiters MUST remain structurally valid.

The `seo-discovery` owner in this change SHALL be the sole writer of parity cases
and fixtures for SEO output, route/discovery output, `llms.txt`, and full-Markdown
serialization. Its base cases MUST remain executable when this catalog change lands
alone. When source provenance is co-applied, that change MUST delegate source-aware
cases that overlap these artifacts to the same `seo-discovery` owner. The shared
`parity-oracle` owner MAY register and execute those owner-supplied cases through
the common framework but MUST NOT author, duplicate, or fork their cases or
fixtures.

Site-data MUST emit a single canonical `prompts` list with lanes and modes and
MUST NOT emit `facet` or parallel `recipes` and `patterns` arrays as the product
model. Non-ranking discovery projections MUST preserve canonical prompt-relative
order. An explicitly documented relevance or analytical projection MAY reorder
prompts by its named score keys, with canonical rank as the final prompt
tie-breaker.

#### Scenario: Production discovery artifacts are emitted

- **WHEN** the production build has a verified base URL
- **THEN** every absolute URL in canonical metadata, sitemap, and discovery output uses that base URL
- **AND** sitemap and `llms.txt` paths are `/`, `/explore/`, and `/catalog/<slug>/` only

#### Scenario: Production base URL is absent

- **WHEN** a production artifact build cannot resolve a trusted base URL
- **THEN** the build exits unsuccessfully before emitting misleading canonical URLs

#### Scenario: The full Markdown export is generated

- **WHEN** prompts contain public operational fields, evaluation branches, source URLs, modes, omission reasons, or nested fence text
- **THEN** `llms-full.txt` retains every applicable field and source in valid Markdown instead of publishing a partial prompt-and-definition view
- **AND** prompt sections follow canonical prompt order and do not serialize prompt `order`, `eval_required`, the raw fill-pointer token, or parallel recipe/pattern chapters

#### Scenario: A required evaluation is published

- **WHEN** a prompt declares `evaluation.policy: required`
- **THEN** the full Markdown export identifies the policy and rationale and preserves every structured acceptance check's ID, type, branch fields, and authored order as an actionable list

#### Scenario: Recommended evaluation has no checks

- **WHEN** a prompt declares `evaluation.policy: recommended` without `acceptance_checks`
- **THEN** discovery output preserves policy and rationale without inventing a check list

#### Scenario: A no-paste mode is published

- **WHEN** a prompt mode declares `template_omission_reason`
- **THEN** discovery output preserves the reason and does not fabricate a template or paste-only post-copy guidance

#### Scenario: A legacy discovery consumer reads retired fields

- **WHEN** SEO or route/discovery generation attempts to read prompt `order` or `eval_required`
- **THEN** its focused tests fail and publication is blocked rather than emitting a compatibility projection

#### Scenario: A discovery projection does not rank prompts

- **WHEN** a scope, lane, grouping, filter, or truncation projection removes prompts without applying a documented ranking
- **THEN** surviving prompt records retain canonical relative order
