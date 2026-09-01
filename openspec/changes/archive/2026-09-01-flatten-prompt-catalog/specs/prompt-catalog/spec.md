<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## Purpose

Defines the flattened prompt catalog product: one item type in `catalog/items/`,
one schema, named modes, job-or-method facet, eight lanes, optional related
links, strict merge-ledger accounting, slug policy, and a single prompt-catalog
count contract.

## ADDED Requirements

### Requirement: Catalog authoring is one prompt type under catalog/items

Every prompt SHALL be authored as `catalog/items/<slug>.yaml`. The public noun
MUST be prompt. Recipes and patterns MUST NOT be types, folders, routes, badges,
or search groups after migrate. `catalog/recipes/` and `catalog/patterns/` MUST
NOT remain as authoring trees. Recipe-only and pattern-only schemas MUST NOT be
used for authoring. Production loaders MUST NOT read those retired trees as a
fallback while `catalog/items/` exists.

#### Scenario: A maintainer adds a prompt

- **WHEN** a new catalog entry is authored
- **THEN** it is a YAML file under `catalog/items/` whose filename stem equals
  its `slug`
- **AND** it is not placed under `catalog/recipes/` or `catalog/patterns/`

#### Scenario: Dual authoring trees are absent after migrate

- **WHEN** catalog validation runs after migration
- **THEN** it loads `catalog/items/` with one parse and rejects a dual reader
  that still scans `catalog/recipes/` or `catalog/patterns/`

### Requirement: One item schema owns identity; modes cannot change it

One item schema SHALL validate every prompt. The item MUST own `slug`, `title`,
`facet`, one `lane`, `blurb`, shared `sources`, evidence, safety, and caveat,
plus shared presentation fields needed for generation (`badge`, `order`). Modes
MUST NOT change slug, title, facet, or lane. Optional method fields
(`definition`, `avoid_when`, `model_api_controls`, `cost_latency`,
`failure_modes`, `eval_required`) MAY appear when they have data. Optional
`related` MAY list other canonical slugs.

#### Scenario: A mode tries to retitle the prompt

- **WHEN** a mode record includes a conflicting title, slug, facet, or lane
- **THEN** validation rejects the item

#### Scenario: Method fields are omitted on a paste-first job

- **WHEN** a job prompt has no definition or cost fields
- **THEN** validation accepts the item and generated pages omit those empty
  sections

### Requirement: Named modes own the paste path

Each prompt SHALL have 1–4 author-approved named modes and exactly one default.
A mode MUST own `id`, `label`, `when_to_use`, copyable `prompt` or a
`template_omission_reason`, `placeholders`, and MAY own extra sources and
`after_copy`. The fill form and copied text MUST follow the selected mode.
There MUST NOT be a freeform module composer or Playbook combinatorics UI.

#### Scenario: A prompt has one mode

- **WHEN** an item declares a single mode marked default
- **THEN** validation accepts it and generated surfaces copy that mode's prompt

#### Scenario: A prompt has four modes and one default

- **WHEN** an item declares four modes and exactly one `default: true`
- **THEN** validation accepts it and fill/copy use the selected mode, defaulting
  to the marked mode when `?mode=` is absent or unknown

#### Scenario: Zero, five, or multiple default modes are authored

- **WHEN** an item has no modes, more than four modes, no default, or more than
  one default
- **THEN** validation rejects it

### Requirement: Facet is job or method only

`facet` SHALL be `job` or `method` only. Merged paste-first prompts MUST be
`job`. A method prompt MAY still show a copyable template on the same page.
Facet MUST be a filter chip on the one home index, not a second tree.

#### Scenario: An item sets facet to recipe or pattern

- **WHEN** `facet` is any value other than `job` or `method`
- **THEN** validation rejects it

#### Scenario: Home filters by facet

- **WHEN** a user selects the method chip on `/`
- **THEN** the index shows method prompts in the eight-lane grouping without
  navigating to a second catalog tree

### Requirement: Every prompt has one of eight lanes

Every prompt SHALL have exactly one lane from `research`, `writing`, `coding`,
`data`, `product`, `operations`, `agents`, and `reasoning`. Former pattern
`section` values MUST map onto that eight-lane set. Pattern sections MUST NOT
remain as a product taxonomy.

#### Scenario: A prompt omits a lane or uses a pattern section as its lane

- **WHEN** `lane` is missing or is a retired pattern-section key
- **THEN** validation rejects it

#### Scenario: Index groups by lane

- **WHEN** home or README renders the catalog
- **THEN** prompts appear in the eight lanes and not under Pattern Notes or
  pattern-section headings

### Requirement: Optional related lists canonical slugs

`related` SHALL be an optional list of other canonical prompt slugs. The item
page MUST show See also for those slugs. Validation MUST fail on missing,
duplicate, or self links. `related-clusters.ts` MUST NOT be a taxonomy.

#### Scenario: Related points at a missing or self slug

- **WHEN** `related` includes the item's own slug, a duplicate, or a slug with
  no item file
- **THEN** validation rejects it

#### Scenario: Neighboring techniques stay separate

- **WHEN** two prompts are related techniques that are not the same job
- **THEN** they remain two items and MAY list each other in `related`

### Requirement: Merge ledger accounts for 91 of 91 with strict variants

An execute-time merge ledger SHALL list every current `catalog/recipes/*.yaml`
and `catalog/patterns/*.yaml` file exactly once as `merged` (canonical slug plus
mode ids) or `singleton`. Two or more current records MUST become one prompt
only when they are the same job in different shapes and share a lane.
Closeout Playbook clusters MUST be candidates only. A proposed merge that does
not share job and lane MUST fail validation. Production loaders MUST NOT read
retired ids. The product MUST NOT have a Playbook type, noun, composer, or
module combinatorics.

Required merges: `plan-and-solve` with `plan-and-solve-prompting`; `ux-review`
with `ux-review-checklist`; `unit-test-writer` with `python-unit-test-writer`;
the panel trio `panel-review`, `panelgpt`, and `expert-panel-discussion`.
Required non-merge: `tree-of-thoughts` and `graph-of-thoughts` stay separate.

#### Scenario: Ledger sums to 91

- **WHEN** the merge ledger is checked against the 48 recipe files and 43
  pattern files
- **THEN** every source file appears exactly once as a merged member or a
  singleton and the total is 91

#### Scenario: A cross-lane cluster is proposed

- **WHEN** a merge groups records that do not share both job and lane
- **THEN** validation fails and no Playbook kind is emitted

#### Scenario: Required same-job pairs become modes

- **WHEN** the plan-and-solve pair, ux-review pair, unit-test pair, or panel
  trio is migrated
- **THEN** each group is one prompt with named modes rather than separate
  catalog types

#### Scenario: Tree of thoughts stays separate from graph of thoughts

- **WHEN** `tree-of-thoughts` and `graph-of-thoughts` are migrated
- **THEN** they remain two prompts and MAY use `related`

### Requirement: Slugs are unique, valid, and not reserved

Slugs SHALL match `^[a-z0-9]+(-[a-z0-9]+)*$`, MUST be globally unique, and
MUST NOT be `catalog`, `explore`, `sources`, `recipes`, `patterns`, `research`,
or `github`. Merged prompts MUST get new canonical slugs. Leftovers whose names
still encode the old split (`*-checklist`, `python-*`, type-suffix
`*-prompting`) MUST be renamed. Famous already-good slugs such as `code-review`
and `tree-of-thoughts` MUST stay.

#### Scenario: A reserved or type-suffix slug is authored

- **WHEN** an item uses slug `catalog`, `recipes`, or a leftover
  `ux-review-checklist` style name that still encodes the old split
- **THEN** validation rejects it unless the slug is an explicitly kept famous
  slug

#### Scenario: Famous slugs are preserved

- **WHEN** `code-review` and `tree-of-thoughts` migrate
- **THEN** their canonical slugs remain unchanged

### Requirement: Count contract is one prompt catalog

Checkers, OpenSpec, Playwright, Python README tests, and AGENTS validation
SHALL use one prompt-catalog contract. `index.yaml` MUST expose
`counts.prompts`. `--full-counts` MUST check that one prompt count. The
48-recipe, 43-pattern, and typed-route count contracts MUST NOT remain.
Generated badges, README, site-data, and SEO copy MUST report prompts, not
recipe vs pattern counts.

#### Scenario: Full-count validation runs

- **WHEN** `--full-counts` or equivalent checkers run after migrate
- **THEN** they compare one prompt total from `index.yaml` and do not require
  48 recipes and 43 patterns

#### Scenario: Badges and README state catalog size

- **WHEN** README badges and the Prompt Library heading are generated
- **THEN** they show prompt catalog size and lanes without a Patterns count or
  Pattern Notes chapter
