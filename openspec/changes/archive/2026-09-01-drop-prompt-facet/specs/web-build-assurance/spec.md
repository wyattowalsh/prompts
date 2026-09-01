<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## MODIFIED Requirements

### Requirement: Catalog authoring contracts are mirrored and enforced

Runtime validation and checked-in public Draft 2020-12 JSON Schemas SHALL agree
on the eight-lane key domain, unique ordered memberships and placeholder names
through a registered custom keyword, credential-free HTTPS source and canonical
GitHub repository URLs, root-only publication base URLs, one item schema for
every prompt, named modes (1–4 with exactly one default), optional `related`
slug integrity, and exactly one meaningful mode `prompt` or
`template_omission_reason`. They MUST NOT require `facet`, pattern-section keys,
recipe-only post-copy as a separate type, or a pattern-template XOR as a second
record kind. README emission SHALL escape structural table/link characters
without changing multi-blank content inside copyable fences. Managed README
shell fragments SHALL match a complete SHA-256 manifest exercised by
catalog-core tests. Package-wide ownership, subset, filename, and reference
checks SHALL remain explicit semantic validation and SHALL be tested separately
from record schemas.

Catalog YAML SHALL also be the only owner of prompt title, slug, color, logo,
chip label, lane membership, featured lane chips, shortcuts, and job-map prompt
mappings. The badge postprocessor MUST consume parsed and validated catalog
data from the same isolated input snapshot as README body generation and MUST
NOT maintain overriding copies of that prompt metadata. `--full-counts` MUST
check one prompt catalog size from `index.yaml` `counts.prompts` and MUST NOT
require 48 recipes and 43 patterns.

#### Scenario: Invalid authoring data reaches validation

- **WHEN** catalog data contains an unknown index key, duplicate membership or
  placeholder, unsafe URL, missing default mode, unknown `facet` property,
  broken `related` link, or a mode with neither prompt nor template omission
  reason
- **THEN** validation rejects it before generated surfaces are written and
  schema-parity tests retain the public contract

#### Scenario: Catalog visual metadata changes

- **WHEN** a valid catalog mutation changes a prompt title, slug, color, logo,
  or chip label
- **THEN** the complete canonical README pipeline propagates it to headings,
  chips, shortcuts, and job-map links from that snapshot

#### Scenario: A managed shell fragment changes

- **WHEN** preamble, middle, or post differs from its recorded digest
- **THEN** the shell-manifest test fails until the intentional fragment and complete manifest update agree

### Requirement: Generated site-data emits one prompts list

Site-data generation SHALL write `{ meta, prompts, lanes }` (plus the
intentionally volatile `generated_at` pairing). `catalog.json` and
`catalog-meta.json` MUST describe prompts with lanes and modes. They MUST NOT
emit `facet`, parallel `recipes` and `patterns` arrays as the product model,
MUST NOT emit `pattern_sections`, and MUST NOT expose recipe vs pattern counts.
The non-mutating freshness check MUST compare those semantic fields while
ignoring only a valid paired `generated_at`.

#### Scenario: Site-data is generated from catalog items

- **WHEN** `pnpm catalog:site-data` runs against `catalog/items/`
- **THEN** both generated JSON files contain a single `prompts` list and lane
  metadata
- **AND** they do not contain product-level `recipes` or `patterns` arrays
- **AND** prompt records do not include `facet`

#### Scenario: Freshness check uses the prompts contract

- **WHEN** `pnpm catalog:site-data:check` compares source-derived output
- **THEN** it fails on prompt/lane/mode drift and does not require
  recipe/pattern array parity or facet fields
