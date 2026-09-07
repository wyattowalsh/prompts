<!-- markdownlint-disable MD013 MD041 -->

## Context

See `proposal.md` for motivation. Catalog prompt and mode records currently embed `{ title, url }` source references, `sources.yaml` separately tracks 124 source inventory records, and the full site-data emitter publishes prompt records unchanged. The web then deduplicates sources by raw URL and keeps whichever title it encounters first. `web/scripts/emit-seo.mjs` also renders prompt-level and mode-level source lists directly from embedded citation URLs, so replacing citations with `{ source_id, title, claim_review }` requires an explicit static-discovery migration rather than only a React consumer migration. The root source checker independently parses a limited YAML subset and applies URL checks that are not shared with catalog-core.

The generated site pair already has a crash-consistent publisher, a bounded metadata companion, and a non-mutating freshness protocol. The active `catalog-contract-completeness-ordering` change separately owns prompt completeness, evaluation, canonical order, compiled prompt shape, and the modification from the older both-files-contain-prompts contract to the bounded companion. This source change has an explicit integration prerequisite: its supported apply/archive wrapper must prove that the complete accepted `catalog-contract-completeness-ordering` delta is already present in the base specifications, including every added or modified requirement rather than only a bounded-metadata sentinel. If that proof is unavailable, the work must remain combined under the prerequisite change; describing two independent archives as atomic is not an enforceable ordering mechanism. The source change adds source semantics without replacing those decisions, without turning `catalog-meta.json` into a second full catalog, and without allowing invalid newly requested input to prevent required recovery of a prior interrupted transaction.

This document and its tasks remain specification-only. They define future production and test ownership but do not authorize edits outside this change directory.

## Goals / Non-Goals

**Goals:**

- Make source identity and provenance a validated compile-time input to full site-data generation.
- Use one conservative URL canonicalizer and stable, location-aware diagnostics.
- Publish a normalized source table with id-based prompt and mode references in `catalog.json` only.
- Preserve every prompt-level and mode-level citation occurrence, authored contextual title, and exact per-citation review state even when prompt and selected-mode occurrences resolve to the same canonical source id.
- Migrate `web/scripts/emit-seo.mjs`, its focused tests, and overlapping SEO, route/discovery, full-Markdown, fixture, and parity coverage to resolve prompt and mode citations through `catalog.sources` without reviving embedded citation URLs or deduplicating occurrence lists.
- Preserve every authored citation title as contextual display text or a searchable alias.
- Model lifecycle status, link status, inventory review, link checking, content review, and per-citation claim review as distinct evidence.
- Bind each claim-review date and support annotation to a deterministic fingerprint of the exact citation, its resolved manifest record's canonical primary URL, and the current claim-bearing catalog projection so a target URL change invalidates the occurrence review and covered public scope.
- Publish claim-scope prose only through an explicit, plain-text-safety-validated, fingerprinted public-review record.
- Preserve the existing paired-output transaction, interrupted-journal recovery precedence, and freshness guarantees.
- Keep source consumers deterministic, static, and network-free.

**Non-Goals:**

- Fetching, scraping, summarizing, classifying, or semantically verifying sources during generation or at runtime.
- Adding remote favicons, a source proxy, a hosted search service, analytics, or AI-generated copy.
- Rewriting citation URLs to observed redirects or replacement URLs automatically.
- Publishing every README-inventory source as an Explore row when it is not cited by a catalog prompt.
- Inferring that link availability, a redirect, a title, or a lifecycle label proves claim support or source quality.
- Retaining a source-level claim-review date that consumers could attach to citations it did not review.
- Copying legacy `claim_scope` or unrestricted maintenance notes into public generated data.
- Refactoring prompt completeness, evaluation policy, canonical ordering, or all publisher internals in this change.
- Treating canonical source-record deduplication as permission to collapse prompt-level and selected-mode citation occurrences.
- Editing production code, tests, source content, status judgments, generated artifacts, or catalog claims as part of this specification work.

## Decisions

### 1. Make catalog-core the source-manifest validation authority

Add a strict source-manifest schema and loader beside the catalog-core schemas. Supported catalog validation and site-data commands receive the source manifest as an explicit input rather than discovering it through a hidden current-working-directory or parent-directory convention. Repository scripts pass the root `sources.yaml`; fixtures pass a fixture-local manifest.

The existing Python checker stops owning URL and source-record validation. Its source-refresh table and coverage checks either move into a Node checker that imports catalog-core or become a thin wrapper over machine-readable catalog-core results. This satisfies the one-normalizer contract; duplicating “equivalent” Python and JavaScript algorithms would preserve a drift surface.

Alternative considered: keep the Python parser and reproduce normalization in both languages. Rejected because parser and normalization parity would become another permanent cross-language contract.

### 2. Use one conservative WHATWG-based URL canonicalizer

Create one pure catalog-core URL module that validates and serializes source and replacement URLs. It requires already-trimmed, credential-free HTTPS input and uses the platform URL parser for standards-based scheme, host, IDNA, port, path, and encoding serialization. It intentionally preserves path case, non-root trailing slashes, queries, query order, and fragments.

All source-manifest uniqueness checks, citation joins, source-refresh URL comparisons, coverage checks, and generated URL values call this module or consume its compiled result. Web consumers use emitted source ids and do not reimplement URL identity.

Alternative considered: aggressive canonicalization that removes trailing slashes, fragments, tracking parameters, or rewrites redirect targets. Rejected because those transformations can collapse distinct authored resources and would require semantic or host-specific policy.

### 3. Separate lifecycle, transport, and review evidence

Replace legacy `status` with two explicit fields:

- `lifecycle_status`: `unreviewed`, `retained`, `stale`, or `replaced`.
- `link_status`: `not_checked`, `reachable`, `redirected`, `blocked`, or `unavailable`.

`retained` means only that an editorial inventory review chose to keep the record; it does not mean current, verified, supported, or high quality. `reachable`, `redirected`, `blocked`, and `unavailable` describe only the most recent recorded link probe. `replaced` requires an explicitly authored replacement URL, and every other lifecycle status requires a null replacement. A redirect may be recorded without selecting the destination as the editorial replacement, so `link_status: redirected` does not require or imply `lifecycle_status: replaced`.

Every source record contains the keys `inventory_reviewed_on`, `link_checked_on`, and `content_reviewed_on`; each value is an ISO calendar date (`YYYY-MM-DD`) or null. “Required” refers to key presence, not a non-null date. `link_status: not_checked` requires `link_checked_on: null`; every other link status requires a non-null link date. A non-`unreviewed` lifecycle status requires a non-null inventory-review date. No date or status implies another review dimension.

Legacy values are evidence to review, not a one-column rename:

- `checked` may establish `reachable` only when separate dated link evidence exists; legacy `last_checked` alone becomes inventory evidence only.
- `redirected` may establish link status but does not establish editorial replacement.
- `blocked` may establish transport blocking but says nothing about lifecycle or support.
- `stale` may establish lifecycle staleness after confirming the old judgment and date; link status is derived separately.
- `replaced` requires confirming the explicit replacement relationship; link status is derived separately.
- `not checked` maps to `link_status: not_checked`; lifecycle remains `unreviewed` unless an inventory review makes an explicit decision.

Presentation uses literal, qualified labels such as “Lifecycle not reviewed,” “Retained in catalog,” “Marked stale,” “Replaced,” “Not link-checked,” “Reachable when checked,” “Redirect observed,” “Probe blocked,” and “Unavailable when checked,” always paired with the relevant date when one exists. UI and docs must not collapse these into “verified,” “current,” “trusted,” or “supported.”

Alternative considered: preserve one `status` enum and document context-dependent meanings. Rejected because transport results and editorial lifecycle are independent and produce misleading badges when combined.

### 4. Bind claim review to one citation and current semantic content

Remove source-level `claim_reviewed_on` and source-level support annotations. A source may instead contain zero or more claim-review records:

```yaml
claim_reviews:
  - citation_key: prompt:<slug>
    reviewed_on: 2026-09-06
    review_fingerprint: sha256:<64-lowercase-hex>
    support_annotations:
      - <reviewed public note>
```

Mode-level keys use `prompt:<slug>:mode:<mode-id>`. Keys are unique within a source and must resolve to a current citation of that source. A missing claim-review record is valid and generates `claim_review: null`; it never inherits another citation's date or annotation.

The compiler owns a versioned claim-bearing projection. For a prompt-level citation it contains the prompt's complete user-facing semantic record, including all modes, while excluding source lists, purely visual/order metadata, provenance, and volatile generated fields. For a mode-level citation it contains shared prompt semantics plus that exact mode's complete user-facing semantic record under the same exclusions. Adding a new user-facing semantic field requires updating the projection and its tests; changing the projection version invalidates prior fingerprints.

`review_fingerprint` is stored as `sha256:<64-lowercase-hex>`. It hashes the UTF-8 bytes of recursively key-sorted JSON with no insignificant whitespace for `{ projection_version, source_id, canonical_primary_url, citation_key, citation_title, reviewed_on, claim_projection, support_annotations }`; arrays preserve their authored order. `canonical_primary_url` is the normalized canonical primary URL resolved from the joined manifest record, never a citation-local copy or replacement URL. Fixed known-answer vectors lock serialization across runtimes. The validator recomputes the payload from current joined authoring data. Any canonical primary URL, prompt claim, mode claim, citation title, review date, annotation, key, or projection-version change produces `SOURCE_CLAIM_REVIEW_STALE` until a maintainer deliberately reviews the new state and runs the review-stamping command. Unknown or duplicate keys produce `SOURCE_CLAIM_REVIEW_TARGET_INVALID`.

Nesting annotations inside the fingerprinted per-citation review record replaces the impossible rule “the validator must know that the date changed in the same maintenance pass.” Validation is now state-complete and implementable: unchanged reviewed content matches its stamp; changed reviewed content cannot carry the old date or annotations into generated output.

Alternative considered: compare only Git history or require the date to change whenever annotation text changes. Rejected because source packages may be validated without a baseline, multiple reviewed edits can occur on one date, and a date-only diff still would not bind review to the current claims.

### 5. Gate public claim scope through explicit reviewed coverage

Legacy `claim_scope` and unrestricted `notes` remain internal migration inputs and are never emitted directly. Optional public scope uses a distinct structured record:

```yaml
public_claim_scope:
  approved_for_publication: true
  text: <reviewed public plain text>
  covered_citations:
    - prompt:<slug>
  reviewed_on: 2026-09-06
  review_fingerprint: sha256:<64-lowercase-hex>
```

Every covered key must resolve to this source and have a current valid claim-review record. The public fingerprint uses the same `sha256:<64-lowercase-hex>` encoding and canonical serializer over `{ projection_version, source_id, approved_for_publication, text, reviewed_on, covered_claim_reviews }`. `covered_claim_reviews` is an array of `{ citation_key, review_fingerprint }` objects sorted by citation key. Because every covered claim fingerprint includes the current resolved `canonical_primary_url`, a canonical source target change first invalidates the occurrence review and then necessarily invalidates public scope derived from that covered fingerprint. A claim, annotation, canonical primary URL, coverage-set, scope-text, review-date, or projection-version change therefore invalidates the public scope deterministically. The explicit review-stamping command has a separate public-scope action that creates or re-stamps only maintainer-selected records after showing text, coverage, canonical target URL, and covered claim fingerprints for review.

Before emission, public scope and support annotations must be already trimmed Unicode NFC plain text without control characters, HTML tags, or Markdown links/images. Each support annotation is limited to 512 Unicode scalar values; public-scope text is limited to 2,000 Unicode scalar values. The renderer treats them as text, never markup. Missing approval, unknown coverage, malformed public text, or a fingerprint mismatch produces a stable public-scope diagnostic and blocks generation rather than silently publishing, sanitizing into different prose, or falling back to legacy text.

Generated `claim_scope` is null only when the `public_claim_scope` key is absent. A present but invalid or stale record blocks projection. When present, it includes only the approved text, review date, and covered citation keys. Consumers may display it only as an authored catalog-use note for those covered citations; it is not a source-wide quality or support badge.

Alternative considered: publish the current free-form `claim_scope` after trimming. Rejected because trimming does not prove public intent, remove internal maintenance wording, or prevent stale scope from being attached to changed claims.

### 6. Build source indexes and claim coverage before projection

Loading retains source, prompt, and mode file locations. Validation canonicalizes manifest primary URLs, rejects invalid values, and constructs unique indexes from source id and canonical primary URL to source record. It then visits every prompt-level and mode-level citation and requires exactly one primary-URL match. Replacement URLs are metadata only and never participate in implicit matching.

Within one prompt-level or mode-level source list, a canonical source id may appear at most once; duplicate same-source citations fail validation rather than making a context-only citation key ambiguous. That within-context rule does not make citations source-global. Prompt-level and each mode-level array remain separate ordered occurrence lists. When a consumer presents prompt-level citations together with the selected mode's citations, it concatenates or otherwise tags those contexts without deduplicating by `source_id`; the same canonical source may therefore appear once for the prompt and once for the selected mode, with each occurrence retaining its own contextual title, citation key, and exact claim-review object or null.

The joined compiled representation attaches a stable `source_id`, resolved canonical primary URL, contextual title, stable citation key, and either a current claim-review record or null to every occurrence. The claim-review fingerprint consumes that resolved canonical URL before validating targets and currentness, then public claim-scope validation consumes the resulting current occurrence fingerprints. Source failures are accumulated with stable codes and file/instance locations. Site-data emission accepts only this source-valid compiled catalog; the CLI must not call the emitter when source diagnostics exist. Canonical source-record deduplication happens only when constructing the top-level source table and deterministic alias set; it never rewrites, merges, or drops citation occurrences.

After the catalog-contract migration lands, this work extends its compiled diagnostics and projection seam. It does not replace that change's prompt completeness, evaluation, omission, or canonical-order rules. Source modules may be developed earlier as pure units, and the seam is supported once integration-preflight task 0.1 records a base-state mode: `independent-base-proven`, when every added or modified requirement in the complete accepted `catalog-contract-completeness-ordering` delta is proven present in the base specifications rather than through a bounded metadata-companion subset or sentinel, or `combined-active`, when that proof is absent. Independent source apply/archive/publication is permitted only under `independent-base-proven`; under `combined-active` the source work remains combined under the prerequisite change while the integrated implementation graph proceeds.

Alternative considered: join inside the React application or `explorer-model.ts`. Rejected because runtime matching cannot protect generated data, cannot fail publication atomically, and would duplicate identity rules.

### 7. Extend only the full site-data artifact

The paired artifacts have different roles:

- `catalog.json` is the full artifact: `{ version, generated_at, meta, lanes, prompts, sources, counts }`.
- `catalog-meta.json` is the bounded companion: matching version/timestamp, shell metadata, bounded counts/lanes as required by the existing shell contract, and `catalog_sha256`, the lowercase SHA-256 digest of the exact committed `catalog.json` bytes. It contains neither the prompt collection nor the source collection.

The full artifact's deterministic `sources` array is sorted by source id and includes only records reached from prompt or mode citations. Generated citations become `{ source_id, title, claim_review }`; `claim_review` is null or contains that citation's reviewed date and ordered annotations. Their owning prompt-level or mode-level array provides citation context, and array order is preserved. A source id may occur once in the prompt list and once in a selected mode list without either occurrence being removed; only the top-level canonical source record is deduplicated. Global URL and provenance fields resolve from the source table. Aliases are the NFC-normalized, trimmed, distinct contextual citation titles that differ from the display title, sorted by Unicode code point.

Generated source records contain stable identity and URL, display title and aliases, owner/type, lifecycle/link status, replacement URL, the three source-level review dates, and nullable approved `claim_scope`. They do not contain a source-level claim-review date or source-level support annotations. The metadata companion does not duplicate those records; its digest binds it to the full bytes in the existing paired transaction.

This is an additive source extension to the full-artifact contract. It neither says both files contain prompts nor replaces the catalog-contract change's canonical prompt ordering, evaluation, mode completeness, omission, and rejected legacy fields.

Alternative considered: enrich every embedded citation or duplicate full collections in `catalog-meta.json`. Rejected because duplication creates stale records, conflicts with the bounded companion role, and increases the pair without improving identity.

### 8. Recover prior transactions before validating new input

A cooperating generation command first resolves and locks the requested output pair, then inspects and safely recovers any validated interrupted journal recorded for that pair. Only after recovery reaches a terminal clean state does it read, parse, normalize, or validate newly requested catalog and source inputs. Recovery uses only the journal, owned staging state, backups, and committed targets from the prior operation; it must not depend on the validity of the newly requested source manifest.

The generator retains the lock while validating the new request. If new source validation fails after recovery, the recovered pair is the immutability baseline: the generator creates no new journal or staging tree, performs no new target publication, removes its ordinary lock/claim state, and reports source diagnostics. Thus invalid input may coexist with required recovery, but it cannot block recovery or leave residue attributable to a new transaction.

If prior recovery metadata is unsafe or recovery itself fails, that failure takes precedence; the command aborts before validating new input and preserves the diagnosable recovery state according to the existing publisher contract. A freshness checker remains non-reclaiming and non-mutating with respect to generated outputs and pre-existing writer/recovery state: it may acquire and release the existing serialized-check lock/claim but leaves no checker-owned residue. If it observes pending recovery, it reports that condition before source validation and directs the maintainer to generation. On a clean pair, the checker validates source input and compares complete source semantics without output or transaction writes beyond that temporary serialized-check ownership.

Alternative considered: validate new source input before inspecting the journal. Rejected because malformed new input could strand or indefinitely defer restoration of a mixed pair created by an earlier valid publication.

### 9. Make source ids canonical record keys without collapsing citations

Catalog accessors resolve id references through a runtime-validated immutable source map. Explore source item ids become `source:<source-id>` rather than `source:<url>`. Search terms include approved display title, aliases, owner, source type, qualified statuses, host, and approved public scope/annotations only when the shared search contract classifies those fields for source search. Prompt pages and source dossiers render contextual titles while reading global provenance from the canonical record and claim-review status from the exact citation. Any prompt-detail projection that combines prompt-level sources with the selected mode's sources preserves both occurrence lists and their relative order; it does not use the canonical source map as a deduplication set.

The runtime boundary rejects unknown schema versions, full/meta digest disagreement, duplicate or missing source ids, unresolved citation references, malformed status/date combinations, source-level claim-review fields, and malformed per-citation review/public-scope projections. The application does not need a URL normalizer because it consumes compile-time ids and normalized URLs.

Alternative considered: keep URL-derived React keys and append metadata. Rejected because it leaves web identity coupled to duplicate normalization and makes per-citation review impossible to represent safely.

### 10. Keep manual and automated evidence visibly separate

Support annotations remain manually authored text nested under one claim review and are emitted only when its current fingerprint validates. Link probes can update only link status/date. A substantive source-body inspection can update content review only when a reviewer actually inspects content. Claim review requires deliberate comparison with one exact current citation projection and an explicit review-stamping action.

The browser receives only committed JSON. Source dossiers and result rows never fetch source pages or favicon services in the background. Ordinary user-initiated anchor navigation remains allowed. Browser tests assert that source inspection causes no same-origin or cross-origin enrichment request and that successful navigation is not described as semantic verification.

Alternative considered: generate source summaries or support text from legacy scope, notes, fetched text, or an AI model. Rejected because it would blur authored evidence with generated interpretation and introduce unreviewed public claims.

### 11. Hand source-valid projection inputs to the catalog publication owner

This change owns source-manifest validation, URL identity, joins, citation occurrence preservation, claim/public-scope fingerprints, source projection construction, and the source-specific comparator/test seam. It does not own an independent checked-pair writer. Source task 7.10 exposes the compiled source seam consumed by the prerequisite change's `site-data-integration` owner. Catalog task 9.4 MUST remain independently schedulable after source task 7.10 and MUST NOT wait for source task 8.12. Source task 8.12 independently locks the integration-readiness fixture contract, and source task 8.13 joins after both source task 8.12 and catalog task 9.4 to run the final cross-change coexistence assertion. The prerequisite change's task 9.6 consumes both source test results.

Only the prerequisite change's `generated-publication` owner writes the checked `web/src/data/catalog.json` and `web/src/data/catalog-meta.json` pair. The prerequisite catalog change alone owns the final combined-byte serialization, the exact-byte `catalog_sha256` computation and storage, pair-integrity determination, the shared comparator's implementation and execution, checked-pair publication, and generated-output freshness; the source workstream supplies deterministic source projections, inputs, expectations, and fixtures only. Source validation and enrichment must pass before that handoff, and the generated-publication owner must consume the final combined projection in one canonical publication. The source workstream may generate fixture-local or temporary bytes for unit and comparator tests, but it must not independently regenerate or publish the checked pair. The parseable source task graph sequences publication task 12.3 after every source implementation and cutover prerequisite, makes coordination task 12.7 depend explicitly on assurance tasks 12.4-12.6, and reserves task 12.8 as the sole closeout node whose oracle proves every other source task is a transitive ancestor.

Independent apply/archive of this source change is authorized only when the repository-owned preflight wrapper records `independent-base-proven`, proving the complete accepted `catalog-contract-completeness-ordering` delta already exists in the base specifications and not only its bounded metadata-companion portion or another sentinel subset. When the preflight instead records `combined-active`, the source work remains inside the prerequisite change's integrated implementation and publication graph with no source-first apply/archive/publication authority and no atomic co-archive claim. This avoids a source-side pair writer, a circular coexistence dependency, and an unenforceable claim that two archives occur atomically.

Alternative considered: let the source workstream regenerate the pair and ask the catalog owner to reconcile afterward. Rejected because two writers can publish mutually incompatible prompt/source schemas and recreate the dependency cycle the prerequisite was meant to prevent.

### 12. Include static SEO and LLM discovery in the source-id migration

`web/scripts/emit-seo.mjs` is a generated-data consumer, not an exception to the source-id contract. Its migration accepts the validated full catalog, builds one immutable lookup from `catalog.sources`, and resolves each prompt-level and mode-level citation's `source_id` to the canonical source URL. The serializer uses the occurrence-owned contextual title and exact claim review; it never expects an embedded citation URL or copies global provenance into the citation.

`llms-full.txt` retains the prompt-level source section and every mode-level source section in their owning positions. If the same source is cited at prompt level and by a mode, both entries remain even though both links resolve through one canonical source record. Other static SEO or LLM-discovery artifacts that serialize citations follow the same rule. Artifacts that do not serialize citation lists are not required to invent one.

When this change is combined with `catalog-contract-completeness-ordering`, the already named `seo-discovery` owner is the sole writer for `web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`, overlapping SEO and route/discovery adapters, full-Markdown serializers, and every fixture or parity surface that exercises those outputs. That owner waits for the prerequisite change's prompt-projection work (catalog task 9.4) and the source projection readiness seam (source task 8.12), then integrates evaluation/order and source-id changes together. Focused tests include prompt-only, mode-only, and same-source-across-prompt-and-mode cases with different titles and review states, plus missing/duplicate source-id failures and deterministic output under shuffled source-table order.

Alternative considered: pre-enrich each citation with a copied URL before calling the existing SEO renderer. Rejected because it recreates duplicated provenance and invites future source/citation drift.

## Risks / Trade-offs

- [Risk] Conservative normalization leaves visually similar URLs unmatched. → Require explicit citation/source correction rather than silently merging uncertain identities.
- [Risk] The breaking full-artifact schema change touches several consumers at once. → Add runtime validation and migrate all consumers atomically before regenerating the committed pair.
- [Risk] Fingerprints can conservatively invalidate reviews after semantically irrelevant edits. → Keep exclusions narrow and versioned; prefer an extra deliberate review over displaying stale coverage.
- [Risk] A maintainer could stamp a fingerprint without performing a real review. → Make stamping an explicit command with an audit-friendly diff, while avoiding claims that software can prove human diligence.
- [Risk] Existing source notes do not prove content or claim review. → Populate only evidence supported by dated records; use null or absent claim-review records rather than inference.
- [Risk] Legacy status values mix transport and editorial judgments. → Produce a reviewed migration matrix and reject automatic one-to-one conversion where dated evidence is missing.
- [Risk] Moving URL checks out of Python can disturb source-refresh assurance. → Port every existing positive and negative fixture before retiring duplicated parsing or validation.
- [Risk] Source work and catalog-contract migration touch compiled-data boundaries. → Require an apply/archive preflight proving the complete accepted prerequisite delta is already in base rather than checking a bounded subset, keep source work combined under that change otherwise, expose an integration-ready source seam before catalog task 9.4, and require task 9.4 to remain independently schedulable without waiting for source task 8.12 before the final coexistence join.
- [Risk] Two workstreams regenerate the checked site-data pair. → Keep source work limited to validation/enrichment and temporary fixtures; delegate the only checked-pair write to the catalog change's `generated-publication` owner.
- [Risk] Source-id lookup is misused as citation deduplication. → Keep prompt and per-mode occurrence arrays separate and test same-source prompt/selected-mode citations with different titles and claim reviews.
- [Risk] Static LLM discovery keeps reading legacy citation URLs. → Assign `emit-seo`, overlapping route/discovery and full-Markdown serializers, and all focused/parity fixtures for those surfaces to the single `seo-discovery` owner and require canonical URL resolution through `catalog.sources`.
- [Risk] Fingerprint fixtures are stamped by test-only logic before production projection code exists. → Keep early fixtures structural only, then stamp positive and stale-state fixtures through production projection/fingerprint code after those implementations land.
- [Risk] Publishing claim scope or annotations can expose internal prose. → Require distinct public records, bounded plain-text validation, exact coverage, and current fingerprints; never emit legacy free text.
- [Risk] Recovery can legitimately modify the pre-command pair before invalid new input is reported. → Test immutability from the recovered baseline and assert no new journal, staging, or publication begins.
- [Risk] Id-based references make hand-edited generated data harder to inspect. → Keep generated files non-authoritative and add focused projection snapshots, digest checks, and referential-integrity tests.

## Migration Plan

1. Add fixture-local source manifests and shape-only cases for URL/schema rules, required-nullable review keys, independent status/date combinations, legacy migration cases, claim-review/public-scope record structure, canonical-primary-URL mutation, and diagnostic vocabulary. Do not stamp accepted review fingerprints with test-only logic.
2. Implement the shared URL normalizer, source-manifest loader/validator, versioned claim projection, deterministic claim fingerprinting over the resolved canonical primary URL, and review-stamping command in catalog-core; only then stamp positive and stale claim-review fixtures—including target-URL changes—through that production code. Port source-refresh and coverage URL checks to consume the same authority.
3. Implement public-scope validation and production fingerprinting, then stamp accepted and stale public-scope fixtures from the production claim-review fingerprints rather than from duplicated fixture hashing, including the transitive stale case where a covered source target URL changes.
4. Inventory every legacy source status, date, scope, note, citation, and source-refresh evidence item. Migrate source identity, independent lifecycle/link fields, explicit nullable dates, and replacements without publishing old scope/notes or inventing claim reviews.
5. Add prompt/mode citation joins, stable citation keys, lossless occurrence lists, per-citation claim-review validation, public-scope coverage validation, and location-rich diagnostics before site-data projection.
6. Expose the compiled source seam at source task 7.10 once integration-preflight task 0.1 records either `independent-base-proven` or `combined-active`; independent apply/archive/publication is authorized only under `independent-base-proven`. Catalog task 9.4 MUST remain independently schedulable after 7.10 and MUST NOT wait for source task 8.12. Independently lock the source readiness fixtures in 8.12, join source task 8.13 after both 8.12 and catalog 9.4, and require prerequisite task 9.6 to consume both source results.
7. Add runtime generated-data validation and migrate prompt-page, selected-mode, Explore, command-index, search, and source-accessor consumers from URL identity and source-level review to source ids and exact occurrence-owned citation review.
8. Under the sole `seo-discovery` owner, migrate `web/scripts/emit-seo.mjs`, `web/scripts/emit-seo.test.mjs`, overlapping SEO and route/discovery adapters, full-Markdown serializers, and all fixtures/parity surfaces for those outputs to resolve prompt/mode citation ids through `catalog.sources` without occurrence loss.
9. Hand the validated combined projection to the prerequisite change's `generated-publication` owner for the only checked-pair regeneration. Verify source semantic drift, digest parity, recovery precedence, and post-recovery immutability without a source-side checked-pair writer.
10. Run schema parity, source-manifest, production-backed claim/public-scope fingerprint fixtures, static discovery, projection, transaction, browser-network, accessibility, deterministic generation, strict OpenSpec, docs, and full repository validation.

Rollback before release is a normal version-control revert of source schema, generated schema, consumers, and regenerated files as one unit. After release, rollback must restore a mutually compatible full-artifact version, metadata/digest companion, and web consumer together; mixed schema versions are not supported.
