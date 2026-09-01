<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## MODIFIED Requirements

### Requirement: Catalog authoring is one prompt type under catalog/items

Every prompt SHALL be authored as `catalog/items/<slug>.yaml`. The public noun
MUST be prompt. Recipes and patterns MUST NOT be types, folders, routes, badges,
or search groups after migrate. `catalog/recipes/` and `catalog/patterns/` MUST
NOT remain as authoring trees. Recipe-only and pattern-only schemas MUST NOT be
used for authoring. Production loaders MUST NOT read those retired trees as a
fallback while `catalog/items/` exists. Job vs method MUST NOT be a catalog
level: there is no `facet` field.

#### Scenario: A maintainer adds a prompt

- **WHEN** a new catalog entry is authored
- **THEN** it is a YAML file under `catalog/items/` whose filename stem equals
  its `slug`
- **AND** it is not placed under `catalog/recipes/` or `catalog/patterns/`
- **AND** it does not declare `facet`

#### Scenario: Dual authoring trees are absent after migrate

- **WHEN** catalog validation runs after migration
- **THEN** it loads `catalog/items/` with one parse and rejects a dual reader
  that still scans `catalog/recipes/` or `catalog/patterns/`

### Requirement: One item schema owns identity; modes cannot change it

One item schema SHALL validate every prompt. The item MUST own `slug`, `title`,
one `lane`, `blurb`, shared `sources`, evidence, safety, and caveat, plus shared
presentation fields needed for generation (`badge`, `order`). Modes MUST NOT
change slug, title, or lane. Optional operational fields (`definition`,
`avoid_when`, `model_api_controls`, `cost_latency`, `failure_modes`,
`eval_required`) MAY appear when they have data. Optional `related` MAY list
other canonical slugs. The schema MUST NOT require or accept `facet`.

#### Scenario: A mode tries to retitle the prompt

- **WHEN** a mode record includes a conflicting title, slug, or lane
- **THEN** validation rejects the item

#### Scenario: Method fields are omitted on a paste-first job

- **WHEN** a prompt has no definition or cost fields
- **THEN** validation accepts the item and generated pages omit those empty
  sections

## REMOVED Requirements

### Requirement: Facet is job or method only

**Reason:** Job vs method was a leftover second catalog level after recipes and
patterns collapsed. Lane, modes, and optional operational sections remain.
**Migration:** Strip `facet` from YAML. Home keeps lane and search filters only.
Validation rejects `facet` as an unknown property.
