<!-- markdownlint-disable MD013 MD022 MD032 MD041 -->

## ADDED Requirements

### Requirement: Source provenance extends only the full paired site-data artifact

This requirement has a normative integration prerequisite on `catalog-contract-completeness-ordering`. A repository-owned preflight MUST determine and record exactly one base-state mode: `independent-base-proven`, when the complete accepted delta from that change is proven present in the base specifications, or `combined-active`, when it is not. The proof MUST cover every added or modified prerequisite requirement and MUST NOT accept only the bounded metadata-companion portion, a sentinel requirement, or a subset of the delta. Independent source apply/archive/publication is authorized only under `independent-base-proven`; under `combined-active` the integrated implementation graph proceeds without source-first apply/archive/publication authority, and tooling MUST NOT claim unsupported atomic co-archive semantics. The source result SHALL compose with the resulting generated prompt contract and MUST NOT replace its prompt completeness, evaluation, omission, or canonical-order rules. The incremented full `catalog.json` SHALL add the canonical source projection and lossless id-based citation occurrences required by `source-provenance-publication`.

The bounded `catalog-meta.json` companion SHALL contain matching `version` and `generated_at`, shell metadata and bounded lanes/counts required by the existing shell contract, and `catalog_sha256`. It MUST contain neither the full prompt collection nor the source collection. `catalog_sha256` MUST be the lowercase SHA-256 digest of the exact committed `catalog.json` bytes.

Both artifacts SHALL continue to publish through the existing exclusive-lock, initializing-journal, same-directory staging, creation-claim, backup, rename, fsync, cleanup, and interrupted-writer recovery protocol. This source extension changes projected content and validation sequencing but MUST NOT weaken paired publication, guarded recovery, checker non-mutation, or failure-residue guarantees.

The source workstream SHALL validate and enrich source projection inputs, fingerprints, and source-specific comparator expectations but MUST NOT own a checked-pair writer. Source task 7.10 SHALL expose the compiled seam consumed by the prerequisite change's `site-data-integration` owner. Catalog prompt projection task 9.4 MUST remain independently schedulable after source task 7.10 and MUST NOT wait for source task 8.12. Source task 8.12 independently locks the integration-readiness result, source task 8.13 MUST join after both source task 8.12 and catalog task 9.4 for final coexistence, and prerequisite task 9.6 MUST consume both source results. `site-data-integration` SHALL remain the sole writer for shared emitter/comparator integration, and the prerequisite change's `generated-publication` owner SHALL be the sole writer of the checked `catalog.json`/`catalog-meta.json` pair only after the parseable source graph proves every source implementation and cutover prerequisite reaches the publication handoff.

#### Scenario: Valid sources extend the full artifact

- **WHEN** site-data generation receives catalog input and a source manifest that pass all catalog and source validation
- **THEN** `catalog.json` contains the deterministic canonical source collection and id-based prompt/mode citations
- **AND** `catalog-meta.json` contains no prompt or source collection
- **AND** both artifacts contain the same supported version and generation timestamp
- **AND** the companion digest matches the exact committed full-artifact bytes

#### Scenario: The companion cannot become a second catalog

- **WHEN** the metadata projection is produced
- **THEN** it is limited to the bounded companion fields defined by the shell and integrity contracts
- **AND** source records, claim reviews, public claim scope, prompt bodies, and mode bodies remain exclusively in `catalog.json`

#### Scenario: Source work composes with the prompt contract

- **WHEN** integration preflight task 0.1 records either `independent-base-proven` or `combined-active`, source task 7.10 exposes the compiled seam, prerequisite task 9.4 remains independently schedulable and completes prompt projection without waiting for source task 8.12, source task 8.13 joins after both task 8.12 and task 9.4, and prerequisite task 9.6 consumes both source results
- **THEN** the resulting prompt contract remains authoritative for prompt completeness, evaluation policy, omission rules, and canonical prompt ordering
- **AND** this change adds source validation, references, and source projection without redefining those prompt decisions
- **AND** only the prerequisite change's `generated-publication` owner writes the checked pair

#### Scenario: The integration prerequisite is absent from base

- **WHEN** the preflight cannot prove every added or modified requirement in the complete accepted `catalog-contract-completeness-ordering` delta is present in the base specifications
- **THEN** it records `combined-active` and refuses the source-first apply/archive/publication attempt rather than refusing all work
- **AND** the integrated implementation graph proceeds combined under the prerequisite change without claiming atomic co-archive support

#### Scenario: Publication or closeout bypasses a source prerequisite

- **WHEN** the parseable task graph leaves any source implementation or cutover task outside publication task 12.3's ancestry, leaves assurance task 12.4, 12.5, or 12.6 outside coordination task 12.7's dependencies, or leaves any non-closeout task outside closeout task 12.8's ancestry
- **THEN** graph assurance fails before checked-pair publication or source-change closeout
- **AND** the prerequisite change's `generated-publication` owner remains the only checked-pair writer

### Requirement: Source semantic freshness is checked without mutation

The site-data freshness checker SHALL compare deterministic source semantics in addition to the existing prompt semantics. Source semantics include canonical source identity, normalized URLs, separate ordered prompt-level and per-mode citation occurrences, contextual citation titles, exact occurrence-owned claim-review/null state, aliases, owner/type, lifecycle/link status, replacement, required nullable review dates, approved public claim scope, referential integrity, and the full/companion digest relationship. A difference in any of those fields SHALL be drift; only volatility explicitly allowed by the existing paired-artifact contract may be ignored. The checker MUST first verify the committed companion digest against the exact committed full bytes, then reuse the valid committed paired `generated_at` when projecting expected artifacts so timestamp volatility does not force digest drift; it MUST NOT ignore `catalog_sha256` independently. The source workstream SHALL supply the source-semantics expectations, fixtures, and interfaces for this comparison; the prerequisite change's shared comparator alone implements and executes the digest-first verification.

The checker SHALL not reclaim or recover an interrupted writer. Pending recovery MUST be reported before newly requested catalog/source validation. When no recovery is pending, validation or freshness failure MUST leave both output files and all transaction state unchanged.

#### Scenario: A source semantic field changes

- **WHEN** a source, citation, alias, claim review, or approved public-scope semantic would change the deterministic full projection
- **THEN** the freshness checker reports drift
- **AND** it does not modify either artifact or pre-existing writer/recovery state, create a journal or staging tree, or leave checker-owned lock/claim residue after releasing the existing serialized-check lock

#### Scenario: One source occurs at prompt and selected-mode levels

- **WHEN** prompt-level and selected-mode citation arrays contain the same `source_id` with different contextual titles or review states
- **THEN** freshness expects and compares both occurrences in their owning arrays
- **AND** removing, merging, reordering, or lending review metadata between them is source semantic drift

#### Scenario: Only the generated timestamp differs

- **WHEN** deterministic full and companion semantics match and the only difference is a valid paired timestamp that the existing freshness contract treats as volatile
- **THEN** freshness passes
- **AND** source comparison does not introduce an additional volatility exception

#### Scenario: The full-artifact digest disagrees

- **WHEN** `catalog-meta.json` contains a digest that does not match the exact current `catalog.json` bytes
- **THEN** freshness fails even if parsed source and prompt values appear equivalent
- **AND** the checker leaves both files unchanged

#### Scenario: Pending recovery and invalid source input coexist

- **WHEN** the checker observes a pending interrupted transaction and the newly requested source manifest is also invalid
- **THEN** it reports pending recovery first and directs the maintainer to generation
- **AND** it neither validates the new source input nor mutates transaction or output state

### Requirement: Source validation runs after required writer recovery and before new publication

A cooperating generator SHALL complete safe recovery for an existing validated journal before reading or validating newly requested catalog/source input. After recovery, the recovered pair SHALL be the immutability baseline for the new request. Source validation or freshness failure SHALL prevent initialization of a new journal, staging tree, or target publication.

Unsafe or failed recovery SHALL take precedence over new-input diagnostics and preserve diagnosable state under the existing publisher protocol. Successful recovery followed by invalid input MAY legitimately differ from the pre-command mixed pair, but MUST leave no residue attributable to a new transaction and MUST NOT modify the recovered pair after validation begins.

#### Scenario: Recovery succeeds before source validation fails

- **WHEN** a cooperating generator starts with a safely recoverable prior journal and invalid newly requested source input
- **THEN** it completes prior recovery and reaches a clean paired baseline
- **AND** it reports the source diagnostics without starting a new publication
- **AND** the recovered artifacts remain byte-for-byte unchanged after that baseline is established

#### Scenario: Recovery cannot be proven safe

- **WHEN** prior transaction metadata fails the existing ownership, path, pair-identity, or phase validation required for guarded recovery
- **THEN** the generator reports recovery failure before reading or validating the new source input
- **AND** it preserves the evidence required by the existing recovery contract

### Requirement: Static discovery has source-id and occurrence parity

The mandatory `seo-discovery-artifact` adapter SHALL cover the source-id migration in `web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`, `llms-full.txt`, overlapping SEO and route/discovery artifacts, full-Markdown serializers, and every fixture or parity surface that serializes prompt-level or mode-level citations. The adapter MUST build or exercise an immutable lookup over `catalog.sources`, require each citation `source_id` to resolve exactly once, compare the canonical URL selected from the source record, and fail on duplicate source ids or unresolved citations. It MUST NOT accept citation-local URLs as a fallback.

Parity SHALL compare separate prompt-level and per-mode occurrence lists before format-specific rendering. It MUST detect contextual-title loss, claim-review/null inheritance, cross-context `source_id` deduplication, and prompt/mode section relocation or reordering. Shuffling canonical source-table traversal MUST NOT change output. The prerequisite change's `seo-discovery` owner SHALL be the only implementation writer for the overlapping emitter, focused tests, SEO/route/discovery adapters, full-Markdown serializers, and every fixture or parity surface for those outputs. Catalog task 9.4 MUST remain independently schedulable after source task 7.10 and MUST NOT wait for source task 8.12; final source-aware parity MUST follow the complete prerequisite preflight, source task 8.12 readiness, catalog task 9.4 prompt projection, and source task 8.13's join after both, after which prerequisite task 9.6 consumes both source results.

#### Scenario: The discovery adapter sees same-source cross-context citations

- **WHEN** one prompt-level occurrence and one selected-mode occurrence resolve to the same canonical source id but have different titles or claim-review states
- **THEN** parity requires both occurrences in their respective discovery contexts and authored order
- **AND** both resolve the same canonical URL without sharing or discarding occurrence-owned metadata

#### Scenario: Discovery source-id resolution is invalid

- **WHEN** a discovery fixture has an unresolved citation id, duplicate canonical source ids, or attempts to use a copied citation URL
- **THEN** the emitter and mandatory discovery adapter reject the fixture before artifact publication
- **AND** no source record is selected by source-table traversal order

#### Scenario: A parallel discovery writer is proposed

- **WHEN** source implementation work attempts to edit the overlapping emitter, tests, SEO/route/discovery adapters, full-Markdown serializers, or their fixture/parity surfaces independently of the prerequisite change's `seo-discovery` owner
- **THEN** integration assurance rejects the ownership split
- **AND** source work remains limited to the normative source-id and occurrence-preservation contract
