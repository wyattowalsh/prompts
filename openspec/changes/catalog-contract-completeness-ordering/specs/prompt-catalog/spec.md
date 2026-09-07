<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## MODIFIED Requirements

### Requirement: One item schema owns identity; modes cannot change it

One item schema SHALL validate every prompt. The item MUST own `slug`, `title`,
one `lane`, `blurb`, shared `sources`, evidence, safety, caveat, and shared
presentation metadata such as `badge`. Modes MUST NOT change slug, title, or
lane. Every item MUST declare a policy-discriminated `evaluation` object whose
`policy` is exactly one of `required`, `recommended`, or `not_required` and whose
`rationale` remains nonblank after trimming. A `required` evaluation MUST contain
one or more structured `acceptance_checks`; a `recommended` evaluation MAY omit
that field or contain a non-empty list, and a `not_required` evaluation MUST omit
it. Each check MUST have an item-local unique kebab-case `id` and match exactly
one branch: `{ id, type: command, run, expect: exit_zero }`, where `run` is a
nonblank single-line command, or `{ id, type: observation, observe,
pass_condition }`, where both text fields remain nonblank after trimming. Bare
strings, unknown fields, duplicate IDs, empty lists, incomplete branches, and
mixed branches are invalid. Validators enforce this deterministic structure;
prompt-level content review separately rejects vague but structurally valid prose
rather than pretending JSON Schema can judge natural-language quality. The
optional or boolean `eval_required` field MUST NOT remain.

Optional operational fields (`definition`, `avoid_when`, `model_api_controls`,
`cost_latency`, and `failure_modes`) MAY appear when they have data. Optional
`related` MAY list other canonical slugs. Item-level prompt `order` MUST NOT be
accepted because canonical prompt order belongs to `catalog/index.yaml`. The
schema MUST NOT require or accept `facet`.

#### Scenario: A mode tries to retitle the prompt

- **WHEN** a mode record includes a conflicting title, slug, or lane
- **THEN** validation rejects the item

#### Scenario: Evaluation policy is explicit

- **WHEN** an item declares one supported evaluation policy, a rationale that remains nonblank after trimming, and every field required by that policy branch
- **THEN** validation accepts the evaluation decision and generated surfaces preserve it

#### Scenario: Required evaluation has executable checks

- **WHEN** an item declares `evaluation.policy: required`
- **THEN** validation requires at least one branch-valid command or observation check with a unique kebab-case ID and generated surfaces render every check as the pre-reliance or pre-release gate

#### Scenario: Recommended evaluation optionally has checks

- **WHEN** an item declares `evaluation.policy: recommended` with no checks or with a non-empty list of branch-valid command or observation checks
- **THEN** validation accepts both forms and generated surfaces preserve authored checks when present without inventing them when absent

#### Scenario: Evaluation check structure is ambiguous

- **WHEN** a check is a bare string such as `verify quality`, has a duplicate or invalid ID, has unknown fields, omits its branch field, mixes command and observation fields, uses a multiline or blank command, or changes `expect` from `exit_zero`
- **THEN** validation rejects the item at the check or check-field path instead of treating unconstrained prose as an executable gate

#### Scenario: Evaluation policy is absent or ambiguous

- **WHEN** an item omits `evaluation`, declares an unsupported policy, has a blank or missing rationale, uses `eval_required`, supplies an empty checks list, declares `required` without checks, or attaches checks to `not_required`
- **THEN** validation rejects the item rather than interpreting absence, a boolean convention, or a non-executable policy label

#### Scenario: Method fields are omitted on a paste-first job

- **WHEN** a prompt has no definition or cost fields
- **THEN** validation accepts the item and generated pages omit those empty sections

#### Scenario: Item-level prompt order is authored

- **WHEN** a prompt item declares `order`
- **THEN** validation rejects the competing order field and directs ordering changes to the prompt's index membership

### Requirement: Named modes own the paste path

Each prompt SHALL have 1–4 author-approved named modes and exactly one default.
Every mode MUST own `id`, `label`, `when_to_use`, and `placeholders`, and MAY own
extra sources. All author-facing required strings in the selected branch MUST
remain nonblank after trimming. Mode IDs MUST be unique within one item; the same
mode ID MAY be reused by different items. The public Draft 2020-12 item schema
MUST validate mode-array and mode-object structure but is intentionally not an
adapter for property-based ID uniqueness, which portable JSON Schema cannot
express. Zod/runtime record semantic validation MUST reject each later duplicate
within an item at `/modes/<index>/id`, and package semantics MUST emit
`DUPLICATE_MODE_ID` at the same logical location.

Each mode MUST match exactly one explicit branch. A paste-path mode MUST have a
nonblank `prompt` and complete `after_copy` containing exact
`fill_pointer: match_placeholder_table`, nonblank `expected_output`, and nonblank
`upgrade_when`. A no-paste-path mode MUST have a nonblank
`template_omission_reason`, exactly `placeholders: []`, and no `prompt` or
`after_copy`. Field absence alone MUST NOT express a template or post-copy
omission. Renderers MUST derive human-facing Fill guidance from the shared
projection of the exact machine token and MUST NOT expose or replace that token
with an independent authority. The fill form and copied text MUST follow the
selected paste-path mode. There MUST NOT be a freeform module composer or
Playbook combinatorics UI.

#### Scenario: A prompt has one mode

- **WHEN** an item declares a single default mode with a nonblank prompt and complete post-copy metadata
- **THEN** validation accepts it and generated surfaces copy that mode's prompt and render its post-copy guidance

#### Scenario: A prompt-bearing mode omits post-copy metadata

- **WHEN** a mode declares `prompt` without complete `after_copy`, or a required post-copy string is blank after trimming
- **THEN** validation rejects it instead of silently omitting Fill, Expected output, or Upgrade when

#### Scenario: A mode explicitly has no paste path

- **WHEN** a mode declares a nonblank `template_omission_reason`, exactly `placeholders: []`, and neither `prompt` nor `after_copy`
- **THEN** validation accepts the explicit omission and generated surfaces explain why no copyable template is available

#### Scenario: A no-paste mode declares placeholder inputs

- **WHEN** a no-paste mode contains any placeholder or omits the required empty placeholders list
- **THEN** validation rejects it rather than presenting non-actionable paste inputs

#### Scenario: A mode mixes paste and omission states

- **WHEN** a mode declares both paste-path and omission fields, or declares neither branch
- **THEN** validation rejects it

#### Scenario: A paste-path mode changes the fill-pointer authority

- **WHEN** `after_copy.fill_pointer` is missing, blank, or differs from `match_placeholder_table`
- **THEN** validation rejects the mode and renderers do not infer, expose, or substitute another fill pointer

#### Scenario: Mode IDs are duplicated within an item

- **WHEN** two modes in one prompt item declare the same `id`
- **THEN** Zod/runtime record semantics reject each later duplicate at `/modes/<index>/id`, and package semantics report `DUPLICATE_MODE_ID` at the same logical location before selection or `?mode=` resolution
- **AND** the public JSON Schema adapter is marked not applicable to this cross-element property comparison rather than falsely claiming to enforce it

#### Scenario: A mode ID is reused by another item

- **WHEN** two different prompt items use the same mode `id`
- **THEN** validation accepts that reuse because mode identity is scoped to its owning prompt

#### Scenario: A prompt has four modes and one default

- **WHEN** an item declares four complete modes and exactly one `default: true`
- **THEN** validation accepts it and fill/copy use the selected mode, defaulting to the marked mode when `?mode=` is absent or unknown

#### Scenario: Zero, five, or multiple default modes are authored

- **WHEN** an item has no modes, more than four modes, no default, or more than one default
- **THEN** validation rejects it

## ADDED Requirements

### Requirement: Catalog index owns canonical prompt order

Canonical user-facing prompt order SHALL be the lane sequence sorted by each
lane's unique `order`, followed by the exact `prompt_slugs` sequence within each
lane in `catalog/index.yaml`; that unique lane `order` is also the sole
lane-display authority. Every raw prompt slug MUST occur exactly once under its
authored lane, and every listed slug and related reference MUST resolve against
the complete raw item set.

Loading MUST expose a raw package that retains index provenance and every physical
item plus its file provenance without selection, deduplication, filtering, or
canonical sorting. Complete record and package validation MUST evaluate that
unchanged raw set. A failed validation MUST expose diagnostics but no canonical
package. Canonicalization MUST accept only a successful validated package, MUST
fail unresolved references instead of skipping them, and MUST materialize the
index-owned lane and prompt sequence. Generator-facing APIs MUST accept only the
canonical package and MUST NOT accept a raw package or reconstruct order from an
unvalidated map.

Empty-query and other non-ranking lane, scope, cluster, grouping, filtering, and
truncation projections MUST preserve canonical prompt-relative order. An
explicitly documented relevance or analytical ranking MAY reorder prompts by its
named score keys and directions, but canonical prompt rank MUST be the final
deterministic prompt tie-breaker. `featured_prompt_slugs` is an explicit
curated-order/ranking exception: its subset MUST preserve the exact authored slug
sequence rather than canonical relative order, every featured slug MUST resolve to
a canonical prompt, and that sequence MUST govern only the featured projection. It
MUST NOT redefine canonical full-catalog or unfiltered order.

#### Scenario: Canonical order is consumed

- **WHEN** validated catalog data is loaded for a generated or interactive surface
- **THEN** its lane and prompt sequences equal unique lane-order plus `prompt_slugs` order from `catalog/index.yaml`

#### Scenario: Raw membership is invalid before canonicalization

- **WHEN** the parsed item set contains an orphan, duplicate, unlisted, missing, wrong-lane, or unresolved prompt reference
- **THEN** validation observes the complete raw set, reports all applicable defects, and returns no canonical package before any projection or sort can hide them

#### Scenario: A generator receives an unvalidated package

- **WHEN** a generator is called with a raw or failed validation result
- **THEN** its API rejects the value and performs zero output writes

#### Scenario: A view filters without ranking prompts

- **WHEN** an empty-query or non-ranking lane, scope, cluster, grouping, filter, or truncation removes prompts from the canonical sequence
- **THEN** the surviving prompts retain canonical relative order

#### Scenario: Search intentionally ranks results

- **WHEN** an explicit search-score, hub, degree, or co-citation projection applies its documented score ordering
- **THEN** prompts may reorder by those keys but ties resolve by canonical prompt rank and the ranking does not become a catalog-order authority

#### Scenario: Featured prompts use authored curation order

- **WHEN** `featured_prompt_slugs` selects canonical prompts in an order that differs from their canonical relative order
- **THEN** the featured projection preserves the exact authored sequence as an explicit curated ranking exception
- **AND** unfiltered and full-catalog projections remain governed only by canonical lane and `prompt_slugs` order

#### Scenario: Lane order is ambiguous

- **WHEN** two lanes declare the same `order` value
- **THEN** validation rejects the catalog instead of applying an implicit tie-breaker

#### Scenario: Index membership conflicts with an item lane

- **WHEN** a prompt slug is listed under a lane other than the prompt's authored lane
- **THEN** validation rejects the catalog

#### Scenario: Prompt membership is incomplete or duplicated

- **WHEN** an existing prompt is absent from `prompt_slugs`, a listed slug is missing, or a slug occurs more than once
- **THEN** validation rejects the catalog before generation

#### Scenario: Filesystem order changes

- **WHEN** prompt filenames are enumerated in a different order without changing `catalog/index.yaml`
- **THEN** canonical prompt order and generated output order remain unchanged
