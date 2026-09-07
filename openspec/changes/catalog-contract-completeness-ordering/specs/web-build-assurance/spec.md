<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## ADDED Requirements

### Requirement: Completeness and ordering contracts have validator parity

A checked executable fixture manifest SHALL be the parity oracle. The focused
entry point MUST be `pnpm catalog:parity`, backed by
`packages/catalog-core/test/validator-parity.test.js` and domain cases/adapters
under `packages/catalog-core/test/validator-parity/`.

The oracle MUST cover these domains and applicable adapters:

| Domain                   | Required adapters                                     |
| ------------------------ | ----------------------------------------------------- |
| `record-item`            | public Draft 2020-12 item schema, Zod item schema     |
| `record-index`           | public Draft 2020-12 index schema, Zod index schema   |
| `package`                | package semantics                                     |
| `generator-boundary`     | canonical-package generator guard                     |
| `readme-artifact`        | Python README semantic checker                        |
| `readme-freshness`       | byte-for-byte README freshness checker                |
| `site-data-artifact`     | structured site-data comparator                       |
| `seo-discovery-artifact` | SEO, route/discovery, and full-Markdown semantic gate |

The manifest MUST own a checked required-coverage matrix that maps each invariant
and mutation class to every adapter capable of enforcing it. A fixture case MAY
narrow adapters only where the design names a technical non-applicability—for
example, portable Draft 2020-12 JSON Schema is not applicable to comparing
`modes[*].id` property values across array elements. The runner MUST fail if a
required matrix cell has no fixture or if a case omits a required adapter. Every
case MUST declare a stable fixture ID, domain, input or mutation, applicable
adapters, expected acceptance, complete expected diagnostics, and expected
observations. Every adapter MUST return:

```js
{
  adapter,
  fixtureId,
  accepted,
  diagnostics: [
    {
      code,
      documentPath,
      instancePath,
      message,
      context
    }
  ],
  observations
}
```

`documentPath` MUST be a stable repository-relative source path or normalized
logical artifact path. `instancePath` MUST be an RFC 6901 JSON Pointer into that
document. Normalization MUST map every native error, suppress generic union or
`oneOf` wrappers when a more specific child diagnostic exists, deduplicate exact
normalized diagnostics, and sort diagnostics by `documentPath`, `instancePath`,
`code`, then canonical JSON serialization of `context`. The runner MUST compare
acceptance, the complete normalized diagnostic array, and declared observations.
Exact `message` prose MAY differ and is not a parity key.

An applicable adapter that is skipped, returns no result, omits an expected
diagnostic, adds an unexpected diagnostic, reports the wrong code/path/context,
accepts a rejected case, rejects an accepted case, or violates a declared
observation MUST fail the oracle. No adapter may claim parity for a domain it does
not execute, and no case may self-declare away a required coverage-matrix cell.
Every raw- or failed-package generator-boundary case MUST execute the generator
guard and observe zero opened or written outputs.

The `parity-oracle` owner SHALL own the shared manifest, runner, builders,
normalization, coverage-matrix integration, and non-overlapping core
`record-item`, `record-index`, `package`, and `generator-boundary` cases. Artifact
projection owners SHALL author their own domain cases and fixtures. The
`seo-discovery` owner SHALL be the sole writer of parity cases and fixtures for
SEO, route/discovery, `llms.txt`, and full-Markdown artifacts. The shared oracle
MAY register and execute those owner-supplied modules but MUST NOT author,
duplicate, or fork them. Catalog-owned SEO/discovery cases MUST execute when this
change lands alone; when source provenance is co-applied, its source-aware overlap
MUST be delegated to the same `seo-discovery` owner.

Through that oracle, every validator applicable to an invariant SHALL agree on
trimmed-string semantics, the exact fill-pointer token and shared projection
boundary, strict paste/no-paste branches, `placeholders: []` for no-paste modes,
structured evaluation-check branches, rejection of item `order` and
`eval_required`, complete raw-set validation before canonicalization, and
canonical base order from `catalog/index.yaml`. Zod/runtime and package semantic
adapters additionally enforce per-item mode-ID uniqueness; the public JSON Schema
adapter is explicitly non-applicable to that property-based cross-element rule.

#### Scenario: A parity fixture omits or changes after-copy guidance

- **WHEN** a paste-path mode lacks `after_copy`, `expected_output`, or `upgrade_when`, or has a missing, blank, or alternate `fill_pointer`
- **THEN** every applicable record adapter rejects it with the complete expected normalized diagnostics

#### Scenario: A parity fixture uses an explicit template omission

- **WHEN** a mode has a nonblank `template_omission_reason`, exactly `placeholders: []`, and neither `prompt` nor `after_copy`
- **THEN** every applicable record adapter accepts the record

#### Scenario: A parity fixture has ambiguous evaluation metadata

- **WHEN** a prompt omits its evaluation decision, uses `eval_required`, declares an unsupported policy, has a blank rationale, uses an empty checks list, declares required evaluation without checks, attaches checks to `not_required`, supplies a bare-string check such as `verify quality`, duplicates a check ID, or supplies an incomplete or mixed command/observation branch
- **THEN** every required applicable record adapter rejects it with the complete expected diagnostics

#### Scenario: Recommended evaluation uses either valid branch

- **WHEN** a prompt declares `recommended` with no checks or a non-empty list of uniquely identified branch-valid command or observation checks
- **THEN** every required applicable record adapter accepts both policy-valid forms

#### Scenario: A package fixture has multiple defects

- **WHEN** one raw package contains duplicate mode identity, missing or duplicated membership, an orphan, wrong-lane membership, or an unresolved reference
- **THEN** package semantics report the complete normalized expected set before canonicalization and expose no canonical package

#### Scenario: A generator receives invalid input

- **WHEN** any mandatory generator-boundary fixture invokes a generator with a raw or failed package
- **THEN** the generator rejects the input before opening an output and its observations report zero output opens and zero output writes

#### Scenario: An artifact fixture violates the contract

- **WHEN** a README or site-data mutation removes, duplicates, or reorders required prompt, mode, structured evaluation-check, post-copy, or pair-integrity data, makes paired `generated_at` values missing, malformed, or unequal, or changes `catalog.json` bytes without updating the exact-byte `catalog_sha256`
- **THEN** its artifact adapter reports the complete expected stable diagnostics at normalized logical artifact paths even when the changed full artifact reparses to equivalent values or only timestamp volatility would otherwise be ignored

#### Scenario: A discovery artifact violates the contract

- **WHEN** an SEO, route/discovery, `llms.txt`, or `llms-full.txt` mutation revives a retired field, exposes the raw fill token, loses a structured evaluation-check field, fabricates paste guidance, or changes canonical prompt-relative order without a named ranking
- **THEN** the mandatory SEO/discovery artifact adapter reports the complete expected stable diagnostics at normalized logical artifact paths

#### Scenario: SEO parity ownership is extended by source provenance

- **WHEN** source provenance adds source-aware parity coverage that overlaps SEO, route/discovery, `llms.txt`, or full-Markdown artifacts
- **THEN** those cases and fixtures are delegated to the existing `seo-discovery` owner and extend its catalog-alone case set
- **AND** `parity-oracle` registers and executes the owner-supplied modules without creating an overlapping case or fixture writer

#### Scenario: The oracle omits an applicable adapter or diagnostic

- **WHEN** a required matrix adapter is skipped, has no covering fixture, returns no normalized result, or differs by a missing or unexpected diagnostic
- **THEN** the parity suite fails rather than treating partial execution as agreement

### Requirement: Contract migration precedes strict enforcement

Existing catalog content and every consumer SHALL be inventoried and migrated to
the complete mode, structured evaluation-check, and canonical-order contracts
before strict integrated validation rejects legacy shapes. Lane owners MUST first
author replacement evaluation/post-copy data while temporarily retaining
`eval_required` and item `order` in the uncommitted working state. Consumer
migration MUST then include both checked fixture trees, checked TypeScript types,
README/web renderers, `web/scripts/emit-seo.mjs`,
`web/scripts/emit-seo.test.mjs`, `routes-from-catalog.mjs`,
`route-descriptors.js`, `scripts/catalog_badge_data.mjs`,
`scripts/catalog_constants.py`, `scripts/check_readme_recipes.py`,
`tests/test_catalog_research_upgrade_2026_07_25.py`, and every remaining reader
of prompt `order`, `eval_required`, fill-pointer data, or canonical prompt order.
The Python literal assertion over `eval_required:` MUST become parsed assertions
over all policy-valid structured evaluation branches. Only after those replacement
readers and checkers are ready may the same lane owners remove the legacy fields
in one coordinated cutover.

The strict schema, runtime validator, raw-set semantic checker, canonical package
boundary, README checker, SEO/discovery exporter, web interaction, and generators
MUST become authoritative in the same change as the completed content migration
and regenerated surfaces. No committed intermediate state MAY require a
compatibility reader, accept both evaluation models, infer omission from absence,
or canonicalize before complete-set validation succeeds.

#### Scenario: Migration inventory is incomplete

- **WHEN** any prompt-bearing mode remains incomplete, a mode ID or fill pointer is invalid, any prompt lacks a valid evaluation branch, or any YAML, fixture, package, README, web, SEO/discovery, Python-test, or order consumer is unaccounted for
- **THEN** strict enforcement and generated-surface publication are blocked

#### Scenario: Migration is ready for enforcement

- **WHEN** every legacy record and consumer is migrated, raw-set validation precedes canonicalization, and every base-order consumer uses the canonical package
- **THEN** the repository can enable the strict contract, regenerate public surfaces, and validate them in one atomic change

#### Scenario: A compatibility path is proposed

- **WHEN** a final reader attempts to support both `eval_required` and `evaluation`, the coordinated cutover retains item `order`, omission is inferred from missing data, or legacy SEO/Python code still reads retired fields
- **THEN** validation rejects the legacy path rather than preserving a shipped dual contract; temporary unused source fields before the coordinated cutover are migration residue, not a supported reader contract

### Requirement: No-paste interaction coverage is executable without production data

The web test suite SHALL own one checked schema-valid authoring fixture at
`web/tests/fixtures/catalog-no-paste/catalog/`, outside production catalog items.
It MUST contain a prompt with one complete paste-path mode and one no-paste-path
mode whose `template_omission_reason` is nonblank, whose `placeholders` is exactly
empty, and which has neither `prompt` nor `after_copy`. The fixture MUST pass the
real public schema, Zod/runtime, and package semantic pipeline. Catalog-core MUST
generate its full/companion site-data into
`web/.tmp/catalog-no-paste/data/` and a fixture entry module in that directory;
none of those generated files is a checked public artifact.

The web application MUST import the full and companion catalog values through the
single fixed module alias `@catalog-data`. One checked exact-specifier target
selector MUST be consumed by both Vite and a Node 24 ESM preload resolver used by
native unit-test commands. Ordinary Vite builds and ordinary Node unit tests MUST
resolve the alias to the checked production-data entry module, so a native ESM
unit test may import a real catalog consumer without relying on Vite resolution.
Only the explicit `catalog-no-paste` test profile, after catalog-core has generated
and validated the fixture pair, MAY resolve the alias to
`web/.tmp/catalog-no-paste/data/catalog-data.mjs`. Unknown profiles, a direct
fixture-target request from an ordinary or publication profile, or bypass of the
checked selector MUST fail closed.

The root command `pnpm web:test:no-paste-fixture` MUST generate and validate the
fixture pair, run the focused native-Node unit/accessibility suite with the preload
resolver selecting that exact fixture entry, and invoke a checked Vite wrapper that
forces `vite build --mode catalog-no-paste --outDir dist-catalog-no-paste`. Before
Vite starts, the wrapper and mode configuration MUST resolve the effective output
path and fail unless it is exactly `web/dist-catalog-no-paste` and distinct from
`web/dist`; environment, config, symlink aliasing, or passthrough arguments MUST NOT
redirect the fixture build to the publication directory. The command MUST serve
only the verified fixture directory and run the focused
`web/tests/playwright.catalog-no-paste.config.mjs` suite. Resolver contract tests
MUST import at least one real catalog consumer under the ordinary and fixture
profiles and MUST reject an unknown or publication fixture profile. The command
MUST NOT mutate production YAML, `web/src/data/catalog.json`,
`web/src/data/catalog-meta.json`, or `web/dist`.

Unit, accessibility, and browser coverage MUST exercise the real prompt-detail
and catalog-preview interactions. Tests MUST assert exact persistent no-paste
copy, exact control presence and DOM absence, transition-only announcements,
initial live-region silence, recovery to paste actions, and no dead disabled focus
stops. They MUST prove that functional Copy link copies only the canonical
prompt-page URL with at most the normalized selected-mode query. They MUST also
prove that no no-paste mode selection or removed paste action writes a prompt body,
filled prompt, or provider payload to the clipboard or opens a provider.

#### Scenario: An ordinary native ESM unit test imports a catalog consumer

- **WHEN** the ordinary Node unit-test command imports a module that consumes `@catalog-data`
- **THEN** the preloaded exact-specifier resolver maps the alias to the checked production entry and the test runs without Vite

#### Scenario: Unit coverage injects the no-paste fixture

- **WHEN** `pnpm web:test:no-paste-fixture` generates and validates the fixture pair before running the focused native-Node unit/accessibility suite under the `catalog-no-paste` test profile
- **THEN** `@catalog-data` resolves to the exact generated fixture entry and assertions exercise real prompt-detail and preview selected-mode rendering plus the exact accessibility contract

#### Scenario: Browser coverage injects the no-paste fixture

- **WHEN** `pnpm web:test:no-paste-fixture` generates the fixture pair and builds in Vite mode `catalog-no-paste`
- **THEN** `@catalog-data` resolves to the generated fixture entry, the checked wrapper verifies the effective output is exactly `web/dist-catalog-no-paste`, and the focused Playwright configuration exercises the ordinary prompt-detail route and preview without changing canonical generated files or `web/dist`

#### Scenario: No-paste Copy link is exercised through the fixture

- **WHEN** unit, accessibility, and isolated browser coverage activates Copy link for the generated no-paste mode
- **THEN** the observed clipboard value is only the canonical prompt-page URL with at most the normalized selected-mode query
- **AND** no prompt body, filled prompt, or provider payload is written and no provider is opened

#### Scenario: Fixture output resolves to the publication directory

- **WHEN** configuration, environment, passthrough arguments, or a path alias would make the `catalog-no-paste` Vite build write to `web/dist` or anywhere other than the dedicated verified fixture directory
- **THEN** the wrapper fails before Vite writes output or a server starts

#### Scenario: An unauthorized profile attempts to enable the fixture seam

- **WHEN** an unknown Node test profile, an ordinary Node unit profile, or any Vite mode other than `catalog-no-paste` requests `web/.tmp/catalog-no-paste/data/catalog-data.mjs`
- **THEN** resolution or the build fails closed rather than exposing or publishing sentinel data

## MODIFIED Requirements

### Requirement: Generated site-data emits one prompts list

Site-data generation SHALL preserve the exact existing paired publication
transaction: one lock, journal, staging tree, candidate pair, backup pair,
recovery flow, permission handling, directory synchronization, and publication
boundary for `catalog.json` and `catalog-meta.json`. Transaction symmetry MUST NOT
imply payload symmetry.

`catalog.json` MUST own full public entity collections, including canonical
`prompts` and lane data. Its top-level collection set MUST remain extensible for
separately specified full collections such as source provenance.
`catalog-meta.json` MUST own compact metadata, aggregate counts, matching supported
version, and `catalog_sha256`; it MUST NOT duplicate full prompt, source, or other
entity collections. One generation run MUST write one valid `generated_at` value
identically into both artifacts. This base contract applies when the catalog change
lands alone. `catalog_sha256` MUST be exactly 64 lowercase hexadecimal characters
encoding SHA-256 over the exact final `catalog.json` byte sequence selected for
publication.
The emitter MUST deterministically serialize the full artifact once, compute the
digest after its final contents are fixed, and publish those same bytes without
re-serialization. Because the full artifact's schema/version field is inside that
byte sequence, the digest MUST bind its version semantics in addition to every full
collection; matching full/companion supported versions remain a separate invariant.
A source-provenance projection MAY extend the full bytes and companion metadata but
MUST reuse this algorithm.

When both changes are applied, the owner named `site-data-integration` in this
change MUST be the sole implementation writer for the emitter, comparator, pair
tests, and combined pure projections. It MUST wait only for
`source-provenance-site-data-bridge` tasks 0.1 and 7.10 to establish the apply
prerequisite and compiled seam, then complete this change's catalog prompt
projection. Catalog task 9.3 MUST NOT wait for source task 8.12 or the final
coexistence task. Source task 8.12 MAY prove integration readiness independently;
source task 8.13 MUST perform final cross-change coexistence testing after catalog
task 9.4. This change's task 9.6 final combined fixture cases MUST consume both
source results. `site-data-integration` MUST NOT regenerate the checked JSON pair.
The source change MUST delegate checked-pair publication to the
`generated-publication` owner, which remains the sole owner allowed to run the
canonical paired generator against the checked outputs.

`catalog.json.prompts` MUST follow canonical lane and `prompt_slugs` sequence and
MUST NOT inherit filesystem order. Prompt records MUST preserve explicit
evaluation policy, rationale, and every policy-valid structured check's ID, type,
branch fields, and authored order. Paste-path
modes MUST preserve complete `after_copy`, while no-paste modes MUST preserve the
explicit omission reason and empty placeholders. Prompt records MUST NOT emit
item `order`, `eval_required`, or `facet`. Neither artifact may revive parallel
`recipes` and `patterns` arrays, `pattern_sections`, or recipe-vs-pattern counts.

The non-mutating site-data comparator MUST first hash the exact committed
`catalog.json` bytes and require the companion's `catalog_sha256` to match before
parsed semantic comparison. It MUST then require both files' `generated_at` values
to be present, valid under the supported timestamp contract, and exactly equal. A
missing, malformed, or unequal value MUST fail pair integrity; only after both
values validate and match MAY their shared value be reused in the expected
projections or their paired volatility be ignored. The comparator MUST then derive
a distinct expected projection for each file from the canonical package, compare
every other nonvolatile semantic field and array order, and verify matching
supported versions and cross-file counts. It MUST NOT ignore either timestamp or
`catalog_sha256` independently, accept parse-equivalent reserialized full bytes, or
compare the two files as symmetric shapes. Separately specified collection checks
MUST execute through their owning capability without assuming prompts are the only
full collection.

#### Scenario: Site-data is generated from catalog items

- **WHEN** `pnpm catalog:site-data` runs against the validated canonical package without a separately specified source projection
- **THEN** `catalog.json` contains full prompt and lane collections while `catalog-meta.json` contains only compact metadata, counts, matching version, and `catalog_sha256`
- **AND** the digest is lowercase SHA-256 over the exact final full-artifact bytes, including its schema/version field, and those same bytes enter the paired publication transaction
- **AND** both artifacts carry valid, exactly equal `generated_at` values
- **AND** `catalog.json.prompts` follows canonical index order and carries explicit evaluation and mode-completeness data
- **AND** prompt records do not contain item `order`, `eval_required`, or `facet`
- **AND** neither file revives product-level `recipes` or `patterns` arrays

#### Scenario: Freshness check uses the prompts contract

- **WHEN** `pnpm catalog:site-data:check` derives and compares each artifact's expected projection
- **THEN** it first fails on any mismatch between `catalog_sha256` and the exact committed `catalog.json` bytes, even when reparsing would produce equivalent values
- **AND** it requires both `generated_at` values to be valid and exactly equal before ignoring their paired volatility
- **AND** it fails on prompt, lane, mode-completeness, evaluation-policy, acceptance-check, canonical-order, pair-metadata, version, or count drift
- **AND** it executes separately specified collection checks without assuming prompts are the only full collection
- **AND** it does not require symmetric file shapes, recipe/pattern arrays, or facet fields

#### Scenario: Paired timestamps are invalid or unequal

- **WHEN** either site-data artifact omits `generated_at`, contains a malformed value, or contains a valid value unequal to its paired artifact
- **THEN** the comparator reports pair-integrity drift before applying any timestamp-volatility allowance

#### Scenario: A source collection is specified separately

- **WHEN** another accepted capability adds full source-provenance records to `catalog.json` and matching compact metadata/digests to `catalog-meta.json`
- **THEN** `site-data-integration` combines both projection implementations and final coexistence tests under the unchanged paired transaction without duplicating source records in the metadata file
- **AND** the source change delegates checked-pair regeneration to the sole `generated-publication` owner

#### Scenario: Shared implementation is ready for publication

- **WHEN** the catalog prompt projection, source projection, comparator, pair tests, source task 8.12 integration-readiness result, source task 8.13 final coexistence case, and unchanged transaction regressions all pass
- **THEN** `generated-publication` alone regenerates the checked pair through the canonical paired command and publishes the exact full-artifact bytes hashed into the companion

#### Scenario: Filename order differs from canonical order

- **WHEN** item files are enumerated in an order that differs from `catalog/index.yaml`
- **THEN** raw-set validation still observes every item before `catalog.json.prompts` is canonicalized and the freshness gate detects any output order drift
